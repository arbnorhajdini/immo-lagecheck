import { formatiereFlaeche, formatiereLaenge } from '@/lib/format'
import type { GrundstueckMasse } from '@/lib/geometrie'
import type { AdressTreffer, KategorieErgebnis, UmgebungsAuswertung } from '@/types'

export interface SteckbriefDaten {
  adresse: AdressTreffer | null
  masse: GrundstueckMasse
  auswertung: UmgebungsAuswertung | null
}

const TITEL = 'Lage-Steckbrief'
const QUELLENANGABE = 'Datenquelle: © OpenStreetMap-Mitwirkende (ODbL)'
const LEERZEILE = ''

function umgebungsZeile({ bezeichnung, naechsterOrt }: KategorieErgebnis, umkreis: string) {
  if (!naechsterOrt) return `- ${bezeichnung}: nicht im Umkreis von ${umkreis}`
  return `- ${bezeichnung}: ${naechsterOrt.ort.name}, ${formatiereLaenge(naechsterOrt.abstandM)}`
}

function umgebungsAbschnitt(auswertung: UmgebungsAuswertung | null): string[] {
  if (!auswertung) return ['Umgebung: noch nicht geprüft']
  const umkreis = formatiereLaenge(auswertung.umkreisM)
  return [
    `Umgebung (Luftlinie ab Grundstücksgrenze, Umkreis ${umkreis}):`,
    ...auswertung.ergebnisse.map((ergebnis) => umgebungsZeile(ergebnis, umkreis)),
  ]
}

function adressZeilen(adresse: AdressTreffer | null): string[] {
  return adresse ? [`Adresse: ${adresse.kurzName}`] : []
}

export function erstelleSteckbrief({ adresse, masse, auswertung }: SteckbriefDaten): string {
  return [
    TITEL,
    ...adressZeilen(adresse),
    `Grundstücksfläche: ${formatiereFlaeche(masse.flaecheQm)}`,
    `Umfang: ${formatiereLaenge(masse.umfangM)}`,
    LEERZEILE,
    ...umgebungsAbschnitt(auswertung),
    LEERZEILE,
    QUELLENANGABE,
  ].join('\n')
}
