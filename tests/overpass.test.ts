import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type LadeOptionen,
  ladeUmgebung,
  OverpassFehler,
  parseOverpassAntwort,
  umgebungsUrl,
} from '@/lib/overpass'

const WOLFSBURG = { lat: 52.41414, lon: 10.83708 }

function jsonAntwort(daten: unknown, status = 200): Response {
  return new Response(JSON.stringify(daten), { status })
}

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

describe('umgebungsUrl', () => {
  it('fragt den eigenen Endpunkt mit gerundetem Mittelpunkt an', () => {
    expect(umgebungsUrl(WOLFSBURG)).toBe('/api/umgebung?lat=52.414&lon=10.837')
  })
})

describe('ladeUmgebung', () => {
  const supermarktAntwort = {
    elements: [{ type: 'node', id: 1, lat: 52.4, lon: 10.8, tags: { shop: 'supermarket' } }],
  }

  function testOptionen() {
    const gewarteteMs: number[] = []
    const optionen: LadeOptionen = {
      wartezeitenVorVersuchMs: [0, 2_000, 5_000],
      warte: async (millisekunden) => {
        gewarteteMs.push(millisekunden)
      },
    }
    return { optionen, gewarteteMs }
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('liest die Orte aus der Antwort des eigenen Endpunkts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonAntwort(supermarktAntwort))
    vi.stubGlobal('fetch', fetchMock)

    const orte = await ladeUmgebung(WOLFSBURG, undefined, testOptionen().optionen)

    expect(fetchMock).toHaveBeenCalledWith(umgebungsUrl(WOLFSBURG), expect.anything())
    expect(orte).toHaveLength(1)
  })

  it('versucht es bei Überlastung nach kurzer Pause erneut', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('at capacity', { status: 502 }))
      .mockResolvedValueOnce(jsonAntwort(supermarktAntwort))
    vi.stubGlobal('fetch', fetchMock)
    const { optionen, gewarteteMs } = testOptionen()

    const orte = await ladeUmgebung(WOLFSBURG, undefined, optionen)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(gewarteteMs).toEqual([0, 2_000])
    expect(orte).toHaveLength(1)
  })

  it('gibt nach drei Versuchen mit wachsenden Pausen auf', async () => {
    const fetchMock = vi.fn().mockImplementation(() => new Response('', { status: 429 }))
    vi.stubGlobal('fetch', fetchMock)
    const { optionen, gewarteteMs } = testOptionen()

    await expect(ladeUmgebung(WOLFSBURG, undefined, optionen)).rejects.toEqual(
      new OverpassFehler(429),
    )
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(gewarteteMs).toEqual([0, 2_000, 5_000])
  })

  it('wertet einen Laufzeitfehler in der Antwort als Zeitüberschreitung', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => jsonAntwort({ remark: 'runtime error: Query timed out' })),
    )

    await expect(ladeUmgebung(WOLFSBURG, undefined, testOptionen().optionen)).rejects.toEqual(
      new OverpassFehler(504),
    )
  })

  it('versucht es bei einer ungültigen Anfrage nicht erneut', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 400 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      ladeUmgebung(WOLFSBURG, undefined, testOptionen().optionen),
    ).rejects.toBeInstanceOf(OverpassFehler)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
