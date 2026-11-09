import { formatiereDatum, formatiereFlaeche, formatiereLaenge } from '@/lib/format'
import type { GrundstueckMasse } from '@/lib/geometrie'
import { luftlinieAb, type Objektart } from '@/lib/objektart'
import type { AdressTreffer, KategorieErgebnis, UmgebungsAuswertung } from '@/types'

export interface SteckbriefDaten {
  objektart: Objektart
  adresse: AdressTreffer | null
  masse: GrundstueckMasse | null
  auswertung: UmgebungsAuswertung | null
}

const TITEL = 'Lage-Steckbrief'
const QUELLENANGABE = 'Datenquelle: © OpenStreetMap-Mitwirkende (ODbL)'
const LEERZEILE = ''

function umgebungsZeile({ bezeichnung, naechsterOrt }: KategorieErgebnis, umkreis: string) {
  if (!naechsterOrt) return `- ${bezeichnung}: nicht im Umkreis von ${umkreis}`
  return `- ${bezeichnung}: ${naechsterOrt.ort.name}, ${formatiereLaenge(naechsterOrt.abstandM)}`
}

function umgebungsAbschnitt(objektart: Objektart, auswertung: UmgebungsAuswertung | null) {
  if (!auswertung) return ['Umgebung: noch nicht geprüft']
  const umkreis = formatiereLaenge(auswertung.umkreisM)
  const stand = formatiereDatum(auswertung.stand)
  return [
    `Umgebung (Luftlinie ab ${luftlinieAb(objektart)}, Umkreis ${umkreis}, Stand ${stand}):`,
    ...auswertung.ergebnisse.map((ergebnis) => umgebungsZeile(ergebnis, umkreis)),
  ]
}

function adressZeilen(adresse: AdressTreffer | null): string[] {
  return adresse ? [`Adresse: ${adresse.kurzName}`] : []
}

function grundstuecksZeilen(masse: GrundstueckMasse | null): string[] {
  if (!masse) return []
  return [
    `Grundstücksfläche: ${formatiereFlaeche(masse.flaecheQm)}`,
    `Umfang: ${formatiereLaenge(masse.umfangM)}`,
  ]
}

export function erstelleSteckbrief({
  objektart,
  adresse,
  masse,
  auswertung,
}: SteckbriefDaten): string {
  return [
    TITEL,
    `Objektart: ${objektart.bezeichnung}`,
    ...adressZeilen(adresse),
    ...grundstuecksZeilen(masse),
    LEERZEILE,
    ...umgebungsAbschnitt(objektart, auswertung),
    LEERZEILE,
    QUELLENANGABE,
  ].join('\n')
}
