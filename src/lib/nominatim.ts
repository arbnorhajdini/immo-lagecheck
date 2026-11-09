import type { AdressTreffer, Begrenzung } from '@/types'

export const NOMINATIM_SUCH_URL = 'https://nominatim.openstreetmap.org/search'
export const MAX_ANGEZEIGTE_TREFFER = 5
export const ABGEFRAGTE_TREFFER = MAX_ANGEZEIGTE_TREFFER * 2
export const MIN_ABSTAND_ZWISCHEN_ANFRAGEN_MS = 1000

type Adressteile = Record<string, string | undefined>

export function baueSuchUrl(suchbegriff: string): string {
  const parameter = new URLSearchParams({
    q: suchbegriff.trim(),
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(ABGEFRAGTE_TREFFER),
    countrycodes: 'de',
    'accept-language': 'de',
  })
  return `${NOMINATIM_SUCH_URL}?${parameter.toString()}`
}

function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return typeof wert === 'object' && wert !== null
}

function alsZahl(wert: unknown): number | null {
  const zahl = typeof wert === 'number' ? wert : Number.parseFloat(String(wert))
  return Number.isFinite(zahl) ? zahl : null
}

function parseBegrenzung(nominatimBoundingbox: unknown): Begrenzung | null {
  if (!Array.isArray(nominatimBoundingbox) || nominatimBoundingbox.length !== 4) return null
  const [sued, nord, west, ost] = nominatimBoundingbox.map(alsZahl)
  if (sued == null || nord == null || west == null || ost == null) return null
  return { sued, west, nord, ost }
}

function ortsname(adresse: Adressteile): string | undefined {
  return adresse.city ?? adresse.town ?? adresse.village ?? adresse.municipality ?? adresse.county
}

function strasseMitHausnummer(adresse: Adressteile): string {
  const strasse = adresse.road ?? adresse.pedestrian ?? adresse.square
  return [strasse, adresse.house_number].filter(Boolean).join(' ')
}

export function formatiereKurzName(adresse: Adressteile | undefined, ersatzName: string): string {
  if (!adresse) return ersatzName
  const plzUndOrt = [adresse.postcode, ortsname(adresse)].filter(Boolean).join(' ')
  const teile = [strasseMitHausnummer(adresse), plzUndOrt].filter(Boolean)
  return teile.length > 0 ? teile.join(', ') : ersatzName
}

function parseTreffer(eintrag: unknown): AdressTreffer | null {
  if (!istObjekt(eintrag)) return null
  const id = alsZahl(eintrag.place_id)
  const lat = alsZahl(eintrag.lat)
  const lon = alsZahl(eintrag.lon)
  const vollName = typeof eintrag.display_name === 'string' ? eintrag.display_name : ''
  if (id == null || lat == null || lon == null || !vollName) return null

  const adressteile = istObjekt(eintrag.address) ? (eintrag.address as Adressteile) : undefined
  return {
    id,
    kurzName: formatiereKurzName(adressteile, vollName),
    vollName,
    lat,
    lon,
    begrenzung: parseBegrenzung(eintrag.boundingbox),
  }
}

function istGueltigerTreffer(treffer: AdressTreffer | null): treffer is AdressTreffer {
  return treffer !== null
}

function ohneDoppelteAdressen(alleTreffer: AdressTreffer[]): AdressTreffer[] {
  const bekannteAdressen = new Set<string>()
  return alleTreffer.filter(({ kurzName }) => {
    if (bekannteAdressen.has(kurzName)) return false
    bekannteAdressen.add(kurzName)
    return true
  })
}

export function parseSuchantwort(antwort: unknown): AdressTreffer[] {
  if (!Array.isArray(antwort)) return []
  const gueltigeTreffer = antwort.map(parseTreffer).filter(istGueltigerTreffer)
  return ohneDoppelteAdressen(gueltigeTreffer).slice(0, MAX_ANGEZEIGTE_TREFFER)
}

export function erstelleRateLimiter(
  minAbstandMs: number,
  aktuelleZeit: () => number = () => Date.now(),
  warte: (millisekunden: number) => Promise<void> = (millisekunden) =>
    new Promise((weiter) => setTimeout(weiter, millisekunden)),
) {
  let naechsterFreierZeitpunkt = 0

  return async function warteAufFreienZeitpunkt(): Promise<void> {
    const jetzt = aktuelleZeit()
    const startzeitpunkt = Math.max(jetzt, naechsterFreierZeitpunkt)
    naechsterFreierZeitpunkt = startzeitpunkt + minAbstandMs
    if (startzeitpunkt > jetzt) await warte(startzeitpunkt - jetzt)
  }
}

const warteAufFreienNominatimZeitpunkt = erstelleRateLimiter(MIN_ABSTAND_ZWISCHEN_ANFRAGEN_MS)

export class NominatimFehler extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Nominatim antwortete mit Status ${status}`)
    this.name = 'NominatimFehler'
    this.status = status
  }
}

export async function sucheAdresse(
  suchbegriff: string,
  signal?: AbortSignal,
): Promise<AdressTreffer[]> {
  await warteAufFreienNominatimZeitpunkt()
  signal?.throwIfAborted()

  const antwort = await fetch(baueSuchUrl(suchbegriff), {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!antwort.ok) throw new NominatimFehler(antwort.status)
  return parseSuchantwort(await antwort.json())
}
