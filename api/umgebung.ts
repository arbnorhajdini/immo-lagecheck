import {
  baueOverpassAbfrage,
  enthaeltLaufzeitfehler,
  liegtInDeutschland,
  rundeMittelpunkt,
} from '../src/lib/overpassAbfrage.js'
import type { Koordinate } from '../src/types.js'

export const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
export const APP_KENNUNG = 'immo-lagecheck/0.1 (+https://github.com/arbnorhajdini/immo-lagecheck)'

const ZEITLIMIT_MS = 55_000
const EINE_WOCHE_S = 7 * 24 * 60 * 60
const EIN_TAG_S = 24 * 60 * 60
const CDN_CACHE_BEI_ERFOLG = `public, s-maxage=${EINE_WOCHE_S}, stale-while-revalidate=${EIN_TAG_S}`
const KEIN_CACHE = 'no-store'
const HTTP_UNGUELTIGE_ANFRAGE = 400
const HTTP_GATEWAY_ZEITUEBERSCHREITUNG = 504
const JSON_INHALT = 'application/json; charset=utf-8'

function leseMittelpunkt(url: URL): Koordinate | null {
  const lat = Number.parseFloat(url.searchParams.get('lat') ?? '')
  const lon = Number.parseFloat(url.searchParams.get('lon') ?? '')
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const mittelpunkt = { lat, lon }
  return liegtInDeutschland(mittelpunkt) ? rundeMittelpunkt(mittelpunkt) : null
}

function fehlerAntwort(status: number, meldung: string): Response {
  return new Response(JSON.stringify({ fehler: meldung }), {
    status,
    headers: { 'Content-Type': JSON_INHALT, 'Cache-Control': KEIN_CACHE },
  })
}

function istVollstaendig(antwort: Response, text: string): boolean {
  return antwort.ok && !enthaeltLaufzeitfehler(text)
}

export async function GET(anfrage: Request): Promise<Response> {
  const mittelpunkt = leseMittelpunkt(new URL(anfrage.url))
  if (!mittelpunkt) {
    return fehlerAntwort(HTTP_UNGUELTIGE_ANFRAGE, 'lat und lon müssen in Deutschland liegen')
  }

  try {
    const antwort = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'User-Agent': APP_KENNUNG },
      body: new URLSearchParams({ data: baueOverpassAbfrage(mittelpunkt) }),
      signal: AbortSignal.timeout(ZEITLIMIT_MS),
    })
    const text = await antwort.text()
    return new Response(text, {
      status: antwort.status,
      headers: {
        'Content-Type': antwort.headers.get('Content-Type') ?? JSON_INHALT,
        'Cache-Control': istVollstaendig(antwort, text) ? CDN_CACHE_BEI_ERFOLG : KEIN_CACHE,
      },
    })
  } catch {
    return fehlerAntwort(HTTP_GATEWAY_ZEITUEBERSCHREITUNG, 'Overpass ist nicht erreichbar')
  }
}
