import { ladeUmgebung } from '@/lib/overpass'
import { mitLocalStorage } from '@/lib/speicher'
import { istObjekt } from '@/lib/typpruefung'
import { UMGEBUNGS_KATEGORIEN } from '@/lib/umgebungKategorien'
import type { Koordinate, UmgebungsOrt } from '@/types'

export const SCHLUESSEL_PRAEFIX = 'immo-lagecheck:umgebung:'
export const GUELTIGKEIT_MS = 7 * 24 * 60 * 60 * 1000
const NACHKOMMASTELLEN_IM_SCHLUESSEL = 3

const BEKANNTE_KATEGORIEN = new Set<unknown>(
  UMGEBUNGS_KATEGORIEN.map(({ schluessel }) => schluessel),
)

export interface GespeicherteUmgebung {
  stand: number
  orte: UmgebungsOrt[]
}

export interface GeladeneUmgebung extends GespeicherteUmgebung {
  ausZwischenspeicher: boolean
}

export function ortsschluessel({ lat, lon }: Koordinate): string {
  const gerundet = [lat, lon].map((wert) => wert.toFixed(NACHKOMMASTELLEN_IM_SCHLUESSEL))
  return `${SCHLUESSEL_PRAEFIX}${gerundet.join(',')}`
}

function hatGueltigeGeometrie(geometrie: unknown): boolean {
  if (!istObjekt(geometrie)) return false
  if (geometrie.art === 'punkt') return istObjekt(geometrie.position)
  return geometrie.art === 'linie' && Array.isArray(geometrie.verlauf)
}

function istUmgebungsOrt(wert: unknown): wert is UmgebungsOrt {
  return (
    istObjekt(wert) &&
    typeof wert.id === 'string' &&
    typeof wert.name === 'string' &&
    BEKANNTE_KATEGORIEN.has(wert.kategorie) &&
    hatGueltigeGeometrie(wert.geometrie)
  )
}

function istGespeicherteUmgebung(wert: unknown): wert is GespeicherteUmgebung {
  return (
    istObjekt(wert) &&
    typeof wert.stand === 'number' &&
    Array.isArray(wert.orte) &&
    wert.orte.every(istUmgebungsOrt)
  )
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function liesEintrag(speicher: Storage, schluessel: string): GespeicherteUmgebung | null {
  const gespeichert = parseJson(speicher.getItem(schluessel) ?? '')
  return istGespeicherteUmgebung(gespeichert) ? gespeichert : null
}

function istAbgelaufen(eintrag: GespeicherteUmgebung, jetzt: number): boolean {
  return jetzt - eintrag.stand > GUELTIGKEIT_MS
}

function eigeneSchluessel(speicher: Storage): string[] {
  return Array.from({ length: speicher.length }, (_, index) => speicher.key(index)).filter(
    (schluessel): schluessel is string => schluessel?.startsWith(SCHLUESSEL_PRAEFIX) ?? false,
  )
}

function entferneAbgelaufeneEintraege(speicher: Storage, jetzt: number): void {
  for (const schluessel of eigeneSchluessel(speicher)) {
    const eintrag = liesEintrag(speicher, schluessel)
    if (!eintrag || istAbgelaufen(eintrag, jetzt)) speicher.removeItem(schluessel)
  }
}

export function leseGespeicherteUmgebung(
  mittelpunkt: Koordinate,
  jetzt = Date.now(),
): GespeicherteUmgebung | null {
  const eintrag = mitLocalStorage(
    (speicher) => liesEintrag(speicher, ortsschluessel(mittelpunkt)),
    null,
  )
  return eintrag && !istAbgelaufen(eintrag, jetzt) ? eintrag : null
}

export function speichereUmgebung(
  mittelpunkt: Koordinate,
  orte: UmgebungsOrt[],
  jetzt = Date.now(),
): void {
  const eintrag: GespeicherteUmgebung = { stand: jetzt, orte }
  mitLocalStorage((speicher) => {
    entferneAbgelaufeneEintraege(speicher, jetzt)
    speicher.setItem(ortsschluessel(mittelpunkt), JSON.stringify(eintrag))
  }, undefined)
}

export async function ladeUmgebungMitZwischenspeicher(
  mittelpunkt: Koordinate,
  signal?: AbortSignal,
  ladeVomDienst = ladeUmgebung,
  aktuelleZeit = () => Date.now(),
): Promise<GeladeneUmgebung> {
  const gespeichert = leseGespeicherteUmgebung(mittelpunkt, aktuelleZeit())
  if (gespeichert) return { ...gespeichert, ausZwischenspeicher: true }

  const orte = await ladeVomDienst(mittelpunkt, signal)
  const stand = aktuelleZeit()
  speichereUmgebung(mittelpunkt, orte, stand)
  return { stand, orte, ausZwischenspeicher: false }
}
