import { formatiereLaenge } from '@/lib/format'
import { abstandZumGrundstueckM, type GrundstueckPolygon } from '@/lib/geometrie'
import type { AdressTreffer } from '@/types'

export const MAX_ABSTAND_ADRESSE_ZUM_GRUNDSTUECK_M = 50

export type Adressabgleich =
  | { status: 'ohneGrundstueck' }
  | { status: 'passt' }
  | { status: 'laedt'; abstandM: number | null }
  | { status: 'ermittelt'; abstandM: number | null; adresse: AdressTreffer }
  | { status: 'fehler'; abstandM: number | null }

export function abstandAdresseZumGrundstueckM(
  adresse: AdressTreffer,
  grundstueck: GrundstueckPolygon,
): number {
  return abstandZumGrundstueckM(grundstueck, {
    art: 'punkt',
    position: { lat: adresse.lat, lon: adresse.lon },
  })
}

export function passtAdresseZumGrundstueck(abstandM: number): boolean {
  return abstandM <= MAX_ABSTAND_ADRESSE_ZUM_GRUNDSTUECK_M
}

export function wirksameAdresse(
  gesuchteAdresse: AdressTreffer | null,
  abgleich: Adressabgleich,
): AdressTreffer | null {
  switch (abgleich.status) {
    case 'ohneGrundstueck':
    case 'passt':
      return gesuchteAdresse
    case 'ermittelt':
      return abgleich.adresse
    case 'laedt':
    case 'fehler':
      return null
  }
}

function entfernungsSatz(abstandM: number | null): string {
  if (abstandM === null) return ''
  return `Das Grundstück liegt ${formatiereLaenge(abstandM)} von der gesuchten Adresse entfernt. `
}

export function adresshinweis(abgleich: Adressabgleich): string {
  switch (abgleich.status) {
    case 'ohneGrundstueck':
    case 'passt':
      return ''
    case 'laedt':
      return 'Adresse am Grundstück wird ermittelt …'
    case 'ermittelt':
      return `${entfernungsSatz(abgleich.abstandM)}Steckbrief und PDF verwenden die Adresse am Grundstück: ${abgleich.adresse.kurzName}.`
    case 'fehler':
      return `${entfernungsSatz(abgleich.abstandM)}Die Adresse am Grundstück konnte nicht ermittelt werden – Steckbrief und PDF nennen deshalb die Koordinaten.`
  }
}
