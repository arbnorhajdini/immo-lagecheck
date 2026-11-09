import type { Bezugsobjekt, GrundstueckPolygon } from '@/lib/geometrie'
import type { AdressTreffer } from '@/types'

export type ObjektartSchluessel = 'haus' | 'wohnung' | 'grundstueck'

export interface Objektart {
  schluessel: ObjektartSchluessel
  bezeichnung: string
  kurzbezeichnung: string
  mitGrundstueck: boolean
}

export const OBJEKTARTEN: Objektart[] = [
  {
    schluessel: 'haus',
    bezeichnung: 'Haus mit Grundstück',
    kurzbezeichnung: 'Haus',
    mitGrundstueck: true,
  },
  {
    schluessel: 'wohnung',
    bezeichnung: 'Wohnung',
    kurzbezeichnung: 'Wohnung',
    mitGrundstueck: false,
  },
  {
    schluessel: 'grundstueck',
    bezeichnung: 'Grundstück (unbebaut)',
    kurzbezeichnung: 'Grundstück',
    mitGrundstueck: true,
  },
]

export const STANDARD_OBJEKTART: Objektart = OBJEKTARTEN[0]!

export function luftlinieAb({ mitGrundstueck }: Objektart): string {
  return mitGrundstueck ? 'Grundstücksgrenze' : 'Adresse'
}

export type Schritt = 'adresse' | 'grundstueck' | 'umgebung' | 'steckbrief'

export function schrittnummern({ mitGrundstueck }: Objektart): Record<Schritt, number | null> {
  const reihenfolge: Schritt[] = mitGrundstueck
    ? ['adresse', 'grundstueck', 'umgebung', 'steckbrief']
    : ['adresse', 'umgebung', 'steckbrief']
  return {
    adresse: null,
    grundstueck: null,
    umgebung: null,
    steckbrief: null,
    ...Object.fromEntries(reihenfolge.map((schritt, index) => [schritt, index + 1])),
  }
}

export function fehlenderSchrittText({ mitGrundstueck }: Objektart): string {
  return mitGrundstueck ? 'Zuerst ein Grundstück einzeichnen.' : 'Zuerst eine Adresse suchen.'
}

export function steckbriefVoraussetzungText({ mitGrundstueck }: Objektart): string {
  return mitGrundstueck
    ? 'Erscheint, sobald ein Grundstück eingezeichnet ist.'
    : 'Erscheint, sobald eine Adresse gesucht ist.'
}

export function bezugsobjektFuer(
  objektart: Objektart,
  adresse: AdressTreffer | null,
  grundstueck: GrundstueckPolygon | null,
): Bezugsobjekt | null {
  if (objektart.mitGrundstueck) return grundstueck ? { art: 'grundstueck', grundstueck } : null
  return adresse ? { art: 'adresse', position: { lat: adresse.lat, lon: adresse.lon } } : null
}
