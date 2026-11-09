import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  baueOverpassAbfrage,
  type LadeOptionen,
  ladeUmgebung,
  OverpassFehler,
  parseOverpassAntwort,
} from '@/lib/overpass'

const WOLFSBURG = { lat: 52.41414, lon: 10.83708 }

function jsonAntwort(daten: unknown, status = 200): Response {
  return new Response(JSON.stringify(daten), { status })
}

describe('baueOverpassAbfrage', () => {
  const abfrage = baueOverpassAbfrage(WOLFSBURG)

  it('sucht im Umkreis von 1.500 m um den Mittelpunkt', () => {
    expect(abfrage).toContain('(around:1500,52.41414,10.83708)')
  })

  it('setzt ein Zeitlimit und fordert JSON an', () => {
    expect(abfrage).toMatch(/^\[out:json\]\[timeout:\d+\];/)
  })

  it('enthält alle Kategorien aus dem Lage-Check', () => {
    expect(abfrage).toContain('nwr["highway"~"^(bus_stop)$"]')
    expect(abfrage).toContain('nwr["railway"~"^(station|halt)$"]')
    expect(abfrage).toContain('nwr["shop"~"^(supermarket)$"]')
    expect(abfrage).toContain('nwr["amenity"~"^(school)$"]')
    expect(abfrage).toContain('nwr["amenity"~"^(kindergarten)$"]')
    expect(abfrage).toContain('nwr["amenity"~"^(pharmacy)$"]')
    expect(abfrage).toContain('nwr["amenity"~"^(doctors)$"]')
    expect(abfrage).toContain('way["highway"~"^(primary|secondary|trunk)$"]')
  })

  it('fordert für Orte den Mittelpunkt und für Straßen den Linienverlauf an', () => {
    expect(abfrage).toContain('out tags center;')
    expect(abfrage).toContain('out tags geom;')
  })
})

describe('parseOverpassAntwort', () => {
  it('liest Punkte, Flächen mit Mittelpunkt und Straßen mit Verlauf', () => {
    const antwort = {
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 52.41,
          lon: 10.83,
          tags: { highway: 'bus_stop', name: 'Reislingen Mitte' },
        },
        {
          type: 'way',
          id: 2,
          center: { lat: 52.42, lon: 10.84 },
          tags: { amenity: 'school', name: 'Grundschule' },
        },
        {
          type: 'way',
          id: 3,
          geometry: [
            { lat: 52.4, lon: 10.8 },
            { lat: 52.41, lon: 10.81 },
          ],
          tags: { highway: 'primary', ref: 'B 188' },
        },
      ],
    }

    expect(parseOverpassAntwort(antwort)).toEqual([
      {
        id: 'node/1',
        kategorie: 'bushaltestelle',
        name: 'Reislingen Mitte',
        geometrie: { art: 'punkt', position: { lat: 52.41, lon: 10.83 } },
      },
      {
        id: 'way/2',
        kategorie: 'schule',
        name: 'Grundschule',
        geometrie: { art: 'punkt', position: { lat: 52.42, lon: 10.84 } },
      },
      {
        id: 'way/3',
        kategorie: 'hauptstrasse',
        name: 'B 188',
        geometrie: {
          art: 'linie',
          verlauf: [
            { lat: 52.4, lon: 10.8 },
            { lat: 52.41, lon: 10.81 },
          ],
        },
      },
    ])
  })

  it('beschriftet Orte ohne Namen verständlich', () => {
    const [apotheke] = parseOverpassAntwort({
      elements: [{ type: 'node', id: 4, lat: 52.4, lon: 10.8, tags: { amenity: 'pharmacy' } }],
    })

    expect(apotheke?.name).toBe('ohne Namen')
  })

  it('ignoriert fremde Kategorien, fehlende Koordinaten und kaputte Antworten', () => {
    const antwort = {
      elements: [
        { type: 'node', id: 5, lat: 52.4, lon: 10.8, tags: { amenity: 'bench' } },
        { type: 'node', id: 6, tags: { shop: 'supermarket' } },
        { type: 'node', id: 7, lat: 52.4, lon: 10.8 },
      ],
    }

    expect(parseOverpassAntwort(antwort)).toEqual([])
    expect(parseOverpassAntwort(null)).toEqual([])
    expect(parseOverpassAntwort({ remark: 'x' })).toEqual([])
  })
})

describe('ladeUmgebung', () => {
  const ZWEI_SERVER = ['https://erster', 'https://zweiter']
  const supermarktAntwort = {
    elements: [{ type: 'node', id: 1, lat: 52.4, lon: 10.8, tags: { shop: 'supermarket' } }],
  }

  function testOptionen(server = ZWEI_SERVER) {
    const gewarteteMs: number[] = []
    const optionen: LadeOptionen = {
      server,
      wartezeitenVorVersuchMs: [0, 2_000, 5_000],
      warte: async (millisekunden) => {
        gewarteteMs.push(millisekunden)
      },
    }
    return { optionen, gewarteteMs }
  }

  function aufgerufeneServer(fetchMock: ReturnType<typeof vi.fn>): unknown[] {
    return fetchMock.mock.calls.map(([url]) => url)
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('weicht nach kurzer Pause auf den nächsten Server aus, wenn der erste überlastet ist', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('at capacity', { status: 502 }))
      .mockResolvedValueOnce(jsonAntwort(supermarktAntwort))
    vi.stubGlobal('fetch', fetchMock)
    const { optionen, gewarteteMs } = testOptionen()

    const orte = await ladeUmgebung(WOLFSBURG, undefined, optionen)

    expect(aufgerufeneServer(fetchMock)).toEqual(['https://erster', 'https://zweiter'])
    expect(gewarteteMs).toEqual([0, 2_000])
    expect(orte).toHaveLength(1)
  })

  it('wechselt bei anhaltender Überlastung die Server ab und gibt dann auf', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('too many', { status: 429 }))
    vi.stubGlobal('fetch', fetchMock)
    const { optionen, gewarteteMs } = testOptionen()

    await expect(ladeUmgebung(WOLFSBURG, undefined, optionen)).rejects.toEqual(
      new OverpassFehler(429),
    )
    expect(aufgerufeneServer(fetchMock)).toEqual([
      'https://erster',
      'https://zweiter',
      'https://erster',
    ])
    expect(gewarteteMs).toEqual([0, 2_000, 5_000])
  })

  it('wertet einen Laufzeitfehler in der Antwort als Zeitüberschreitung und versucht es erneut', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => jsonAntwort({ remark: 'runtime error: Query timed out' }))
    vi.stubGlobal('fetch', fetchMock)
    const { optionen } = testOptionen(['https://einziger'])

    await expect(ladeUmgebung(WOLFSBURG, undefined, optionen)).rejects.toEqual(
      new OverpassFehler(504),
    )
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('versucht bei einer fehlerhaften Abfrage keinen weiteren Server', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('bad request', { status: 400 }))
    vi.stubGlobal('fetch', fetchMock)
    const { optionen } = testOptionen()

    await expect(ladeUmgebung(WOLFSBURG, undefined, optionen)).rejects.toBeInstanceOf(
      OverpassFehler,
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
