import { alsZahl, istObjekt } from '@/lib/typpruefung'
import {
  alsOverpassFilter,
  findeKategorie,
  type OsmTags,
  UMGEBUNGS_KATEGORIEN,
  UMKREIS_M,
  type UmgebungsKategorie,
} from '@/lib/umgebungKategorien'
import type { Koordinate, Ortsgeometrie, UmgebungsOrt } from '@/types'

export const OVERPASS_SERVER = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
export const OVERPASS_ZEITLIMIT_S = 25
export const GESAMT_ZEITLIMIT_MS = 60_000
export const WARTEZEITEN_VOR_VERSUCH_MS = [0, 2_000, 5_000]
export const STATUS_ZEITUEBERSCHREITUNG = 504
const STATUS_SERVER_UEBERLASTET = new Set([429, 502, 503, 504])
const OHNE_NAMEN = 'ohne Namen'

export class OverpassFehler extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Overpass antwortete mit Status ${status}`)
    this.name = 'OverpassFehler'
    this.status = status
  }
}

function kategorienMitGeometrie(art: Ortsgeometrie['art']): UmgebungsKategorie[] {
  return UMGEBUNGS_KATEGORIEN.filter((kategorie) => kategorie.geometrieArt === art)
}

export function baueOverpassAbfrage(mittelpunkt: Koordinate, umkreisM = UMKREIS_M): string {
  const umkreis = `(around:${umkreisM},${mittelpunkt.lat},${mittelpunkt.lon})`
  const ortsabfragen = kategorienMitGeometrie('punkt')
    .map(({ bedingung }) => `nwr${alsOverpassFilter(bedingung)}${umkreis};`)
    .join('')
  const linienabfragen = kategorienMitGeometrie('linie')
    .map(({ bedingung }) => `way${alsOverpassFilter(bedingung)}${umkreis};`)
    .join('')

  return [
    `[out:json][timeout:${OVERPASS_ZEITLIMIT_S}];`,
    `(${ortsabfragen});out tags center;`,
    `(${linienabfragen});out tags geom;`,
  ].join('')
}

function parseKoordinate(wert: unknown): Koordinate | null {
  if (!istObjekt(wert)) return null
  const lat = alsZahl(wert.lat)
  const lon = alsZahl(wert.lon)
  return lat == null || lon == null ? null : { lat, lon }
}

function istKoordinate(wert: Koordinate | null): wert is Koordinate {
  return wert !== null
}

function parseGeometrie(
  element: Record<string, unknown>,
  art: Ortsgeometrie['art'],
): Ortsgeometrie | null {
  if (art === 'linie') {
    const verlauf = Array.isArray(element.geometry)
      ? element.geometry.map(parseKoordinate).filter(istKoordinate)
      : []
    return verlauf.length > 0 ? { art: 'linie', verlauf } : null
  }
  const position = parseKoordinate(element.center ?? element)
  return position ? { art: 'punkt', position } : null
}

function ortsname(tags: OsmTags): string {
  return tags.name ?? tags.ref ?? OHNE_NAMEN
}

function parseElement(element: unknown): UmgebungsOrt[] {
  if (!istObjekt(element) || !istObjekt(element.tags)) return []
  const tags = element.tags as OsmTags
  const kategorie = findeKategorie(tags)
  if (!kategorie) return []
  const geometrie = parseGeometrie(element, kategorie.geometrieArt)
  if (!geometrie) return []

  return [
    {
      id: `${String(element.type)}/${String(element.id)}`,
      kategorie: kategorie.schluessel,
      name: ortsname(tags),
      geometrie,
    },
  ]
}

export function parseOverpassAntwort(antwort: unknown): UmgebungsOrt[] {
  if (!istObjekt(antwort) || !Array.isArray(antwort.elements)) return []
  return antwort.elements.flatMap(parseElement)
}

function enthaeltLaufzeitfehler(antwort: unknown): boolean {
  return (
    istObjekt(antwort) &&
    typeof antwort.remark === 'string' &&
    antwort.remark.includes('runtime error')
  )
}

export function istZeitueberschreitung(fehler: unknown): boolean {
  return fehler instanceof DOMException && fehler.name === 'TimeoutError'
}

function lohntNeuerVersuch(fehler: unknown): boolean {
  if (fehler instanceof OverpassFehler) return STATUS_SERVER_UEBERLASTET.has(fehler.status)
  return fehler instanceof TypeError
}

function mitGesamtZeitlimit(signal?: AbortSignal): AbortSignal {
  const zeitlimit = AbortSignal.timeout(GESAMT_ZEITLIMIT_MS)
  return signal ? AbortSignal.any([signal, zeitlimit]) : zeitlimit
}

function warteMs(millisekunden: number): Promise<void> {
  return new Promise((weiter) => setTimeout(weiter, millisekunden))
}

async function frageServer(serverUrl: string, abfrage: string, signal: AbortSignal) {
  const antwort = await fetch(serverUrl, {
    method: 'POST',
    body: new URLSearchParams({ data: abfrage }),
    signal,
  })
  if (!antwort.ok) throw new OverpassFehler(antwort.status)
  const daten: unknown = await antwort.json()
  if (enthaeltLaufzeitfehler(daten)) throw new OverpassFehler(STATUS_ZEITUEBERSCHREITUNG)
  return daten
}

export interface LadeOptionen {
  server?: string[]
  wartezeitenVorVersuchMs?: number[]
  warte?: (millisekunden: number) => Promise<void>
}

export async function ladeUmgebung(
  mittelpunkt: Koordinate,
  signal?: AbortSignal,
  {
    server = OVERPASS_SERVER,
    wartezeitenVorVersuchMs = WARTEZEITEN_VOR_VERSUCH_MS,
    warte = warteMs,
  }: LadeOptionen = {},
): Promise<UmgebungsOrt[]> {
  const abfrage = baueOverpassAbfrage(mittelpunkt)
  const begrenztesSignal = mitGesamtZeitlimit(signal)
  let letzterFehler: unknown = new OverpassFehler(STATUS_ZEITUEBERSCHREITUNG)

  for (const [versuch, wartezeit] of wartezeitenVorVersuchMs.entries()) {
    await warte(wartezeit)
    begrenztesSignal.throwIfAborted()
    const serverUrl = server[versuch % server.length]!
    try {
      return parseOverpassAntwort(await frageServer(serverUrl, abfrage, begrenztesSignal))
    } catch (fehler) {
      if (begrenztesSignal.aborted || !lohntNeuerVersuch(fehler)) throw fehler
      letzterFehler = fehler
    }
  }
  throw letzterFehler
}
