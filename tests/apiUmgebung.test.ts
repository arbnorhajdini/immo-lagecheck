import { afterEach, describe, expect, it, vi } from 'vitest'
import { APP_KENNUNG, GET, OVERPASS_URL } from '../api/umgebung'

function anfrage(suche: string): Request {
  return new Request(`https://immo-lagecheck.vercel.app/api/umgebung${suche}`)
}

function overpassAntwort(text: string, status = 200): Response {
  return new Response(text, { status, headers: { 'Content-Type': 'application/json' } })
}

describe('GET /api/umgebung', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lehnt fehlende oder ungültige Koordinaten ab, ohne Overpass zu fragen', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const ohne = await GET(anfrage(''))
    const kaputt = await GET(anfrage('?lat=abc&lon=10'))

    expect(ohne.status).toBe(400)
    expect(kaputt.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lehnt Orte außerhalb Deutschlands ab, damit der Endpunkt kein offener Proxy ist', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const paris = await GET(anfrage('?lat=48.8566&lon=2.3522'))

    expect(paris.status).toBe(400)
    expect(paris.headers.get('Cache-Control')).toBe('no-store')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fragt Overpass mit eigener App-Kennung und selbst gebauter Abfrage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(overpassAntwort('{"elements":[]}'))
    vi.stubGlobal('fetch', fetchMock)

    await GET(anfrage('?lat=52.41414&lon=10.83708'))

    const [url, optionen] = fetchMock.mock.calls[0]!
    const abfrage = new URLSearchParams(String(optionen.body)).get('data') ?? ''
    expect(url).toBe(OVERPASS_URL)
    expect(optionen.headers['User-Agent']).toBe(APP_KENNUNG)
    expect(abfrage).toContain('(around:1500,52.414,10.837)')
  })

  it('lässt vollständige Antworten eine Woche im Vercel-CDN zwischenspeichern', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(overpassAntwort('{"elements":[]}')))

    const antwort = await GET(anfrage('?lat=52.414&lon=10.837'))

    expect(antwort.status).toBe(200)
    expect(antwort.headers.get('Cache-Control')).toContain('s-maxage=604800')
    expect(await antwort.text()).toBe('{"elements":[]}')
  })

  it('speichert Überlastung und abgebrochene Läufe nicht zwischen', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(overpassAntwort('at capacity', 502))
        .mockResolvedValueOnce(overpassAntwort('{"remark": "runtime error: timeout"}')),
    )

    const ueberlastet = await GET(anfrage('?lat=52.414&lon=10.837'))
    const abgebrochen = await GET(anfrage('?lat=52.414&lon=10.837'))

    expect(ueberlastet.status).toBe(502)
    expect(ueberlastet.headers.get('Cache-Control')).toBe('no-store')
    expect(abgebrochen.headers.get('Cache-Control')).toBe('no-store')
  })

  it('meldet 504, wenn Overpass gar nicht erreichbar ist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

    const antwort = await GET(anfrage('?lat=52.414&lon=10.837'))

    expect(antwort.status).toBe(504)
  })
})
