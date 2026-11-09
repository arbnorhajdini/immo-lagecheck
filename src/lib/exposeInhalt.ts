import {
  formatiereDatum,
  formatiereHektar,
  formatiereIsoDatum,
  formatiereLaenge,
  formatiereQuadratmeter,
  istHektarRelevant,
} from '@/lib/format'
import type { GrundstueckMasse } from '@/lib/geometrie'
import { nummeriereGefundeneOrte } from '@/lib/umgebung'
import type { AdressTreffer, Koordinate, UmgebungsAuswertung } from '@/types'

export interface ExposeDaten {
  adresse: AdressTreffer | null
  masse: GrundstueckMasse
  mittelpunkt: Koordinate
  auswertung: UmgebungsAuswertung | null
  erstelltAm: number
}

export interface Kennzahl {
  bezeichnung: string
  wert: string
  zusatz: string
}

export interface UmgebungsZeile {
  nummer: number | null
  kategorie: string
  name: string
  entfernung: string
}

export interface UmgebungsAbschnitt {
  ueberschrift: string
  unterzeile: string
  legende: string
  zeilen: UmgebungsZeile[]
}

export interface ExposeInhalt {
  titel: string
  untertitel: string
  erstelltAm: string
  kennzahlen: Kennzahl[]
  naechsteZiele: Kennzahl[]
  umgebung: UmgebungsAbschnitt | null
  hinweis: string
  quellenangabe: string
  dateiname: string
}

const TITEL_OHNE_ADRESSE = 'Grundstück'
const ANZAHL_NAECHSTE_ZIELE = 4
const HINWEIS =
  'Alle Angaben ohne Gewähr. Fläche und Umfang wurden aus der eingezeichneten Grenze berechnet ' +
  'und ersetzen keine amtliche Vermessung. Entfernungen sind Luftlinie ab Grundstücksgrenze.'
const QUELLENANGABE = 'Karten und Umgebungsdaten: © OpenStreetMap-Mitwirkende (ODbL)'

const UMLAUTE: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  Ä: 'Ae',
  Ö: 'Oe',
  Ü: 'Ue',
  ß: 'ss',
}

const koordinate = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

function formatiereKoordinaten({ lat, lon }: Koordinate): string {
  return `${koordinate.format(lat)}° N, ${koordinate.format(lon)}° O`
}

function alsDateinamenteil(text: string): string {
  return text
    .replace(/[äöüÄÖÜß]/g, (umlaut) => UMLAUTE[umlaut] ?? umlaut)
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function titelUndUntertitel(adresse: AdressTreffer | null, mittelpunkt: Koordinate) {
  if (!adresse) {
    return { titel: TITEL_OHNE_ADRESSE, untertitel: formatiereKoordinaten(mittelpunkt) }
  }
  const [strasse = adresse.kurzName, ...ort] = adresse.kurzName.split(', ')
  return { titel: strasse, untertitel: ort.join(', ') }
}

function flaechenKennzahl({ flaecheQm }: GrundstueckMasse): Kennzahl {
  return {
    bezeichnung: 'Grundstücksfläche',
    wert: formatiereQuadratmeter(flaecheQm),
    zusatz: istHektarRelevant(flaecheQm) ? formatiereHektar(flaecheQm) : 'eingezeichnet',
  }
}

function umfangsKennzahl({ umfangM }: GrundstueckMasse): Kennzahl {
  return { bezeichnung: 'Umfang', wert: formatiereLaenge(umfangM), zusatz: 'Grundstücksgrenze' }
}

function infrastrukturKennzahl(auswertung: UmgebungsAuswertung | null): Kennzahl {
  if (!auswertung) {
    return { bezeichnung: 'Infrastruktur', wert: '–', zusatz: 'noch nicht geprüft' }
  }
  const { ergebnisse, umkreisM } = auswertung
  const gefunden = ergebnisse.filter(({ naechsterOrt }) => naechsterOrt !== null).length
  return {
    bezeichnung: 'Infrastruktur',
    wert: `${gefunden} von ${ergebnisse.length}`,
    zusatz: `Kategorien im Umkreis von ${formatiereLaenge(umkreisM)}`,
  }
}

function umgebungsAbschnitt(auswertung: UmgebungsAuswertung): UmgebungsAbschnitt {
  const umkreis = formatiereLaenge(auswertung.umkreisM)
  const nummerJeKategorie = new Map(
    nummeriereGefundeneOrte(auswertung.ergebnisse).map(({ ergebnis, nummer }) => [
      ergebnis.kategorie,
      nummer,
    ]),
  )

  return {
    ueberschrift: `Infrastruktur im Umkreis von ${umkreis}`,
    unterzeile: `Luftlinie ab Grundstücksgrenze · Stand der Daten ${formatiereDatum(auswertung.stand)}`,
    legende:
      'Schwarzer Punkt: Grundstück · Nummern: nächster Ort je Kategorie · orange: Hauptstraße',
    zeilen: auswertung.ergebnisse.map(({ kategorie, bezeichnung, naechsterOrt }) => ({
      nummer: nummerJeKategorie.get(kategorie) ?? null,
      kategorie: bezeichnung,
      name: naechsterOrt?.ort.name ?? `nicht im Umkreis von ${umkreis}`,
      entfernung: naechsterOrt ? formatiereLaenge(naechsterOrt.abstandM) : '–',
    })),
  }
}

function naechsteZiele(auswertung: UmgebungsAuswertung | null): Kennzahl[] {
  if (!auswertung) return []
  return nummeriereGefundeneOrte(auswertung.ergebnisse)
    .sort((a, b) => a.naechsterOrt.abstandM - b.naechsterOrt.abstandM)
    .slice(0, ANZAHL_NAECHSTE_ZIELE)
    .map(({ ergebnis, naechsterOrt }) => ({
      bezeichnung: ergebnis.bezeichnung,
      wert: formatiereLaenge(naechsterOrt.abstandM),
      zusatz: naechsterOrt.ort.name,
    }))
}

function dateiname(titel: string, untertitel: string, erstelltAm: number): string {
  const teile = ['Lage-Steckbrief', titel, untertitel, formatiereIsoDatum(erstelltAm)]
    .map(alsDateinamenteil)
    .filter(Boolean)
  return `${teile.join('_')}.pdf`
}

export function erstelleExposeInhalt({
  adresse,
  masse,
  mittelpunkt,
  auswertung,
  erstelltAm,
}: ExposeDaten): ExposeInhalt {
  const { titel, untertitel } = titelUndUntertitel(adresse, mittelpunkt)
  return {
    titel,
    untertitel,
    erstelltAm: `Erstellt am ${formatiereDatum(erstelltAm)}`,
    kennzahlen: [
      flaechenKennzahl(masse),
      umfangsKennzahl(masse),
      infrastrukturKennzahl(auswertung),
    ],
    naechsteZiele: naechsteZiele(auswertung),
    umgebung: auswertung ? umgebungsAbschnitt(auswertung) : null,
    hinweis: HINWEIS,
    quellenangabe: QUELLENANGABE,
    dateiname: dateiname(
      adresse ? titel : TITEL_OHNE_ADRESSE,
      adresse ? untertitel : '',
      erstelltAm,
    ),
  }
}
