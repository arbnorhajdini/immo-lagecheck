import {
  formatiereDatum,
  formatiereHektar,
  formatiereIsoDatum,
  formatiereLaenge,
  formatiereQuadratmeter,
  istHektarRelevant,
} from '@/lib/format'
import type { GrundstueckMasse } from '@/lib/geometrie'
import { luftlinieAb, type Objektart } from '@/lib/objektart'
import { nummeriereGefundeneOrte } from '@/lib/umgebung'
import type { AdressTreffer, Koordinate, UmgebungsAuswertung } from '@/types'

export interface ExposeDaten {
  objektart: Objektart
  adresse: AdressTreffer | null
  masse: GrundstueckMasse | null
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
  etikett: string
  kartenunterschrift: string
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

const ANZAHL_NAECHSTE_ZIELE = 4
const KARTENBASIS = 'Kartenbasis © OpenStreetMap-Mitwirkende'
const HINWEIS_MIT_GRUNDSTUECK =
  'Alle Angaben ohne Gewähr. Fläche und Umfang wurden aus der eingezeichneten Grenze berechnet ' +
  'und ersetzen keine amtliche Vermessung. Entfernungen sind Luftlinie ab Grundstücksgrenze.'
const HINWEIS_AB_ADRESSE =
  'Alle Angaben ohne Gewähr. Entfernungen sind Luftlinie ab der Adresse des Gebäudes ' +
  '(Lagepunkt aus OpenStreetMap), nicht ab der Wohnungstür.'
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

function titelUndUntertitel(
  objektart: Objektart,
  adresse: AdressTreffer | null,
  mittelpunkt: Koordinate,
) {
  if (!adresse) {
    return { titel: objektart.bezeichnung, untertitel: formatiereKoordinaten(mittelpunkt) }
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

function objektartKennzahl(objektart: Objektart): Kennzahl {
  return {
    bezeichnung: 'Objektart',
    wert: objektart.bezeichnung,
    zusatz: `Entfernungen ab ${luftlinieAb(objektart)}`,
  }
}

function naechstesZielKennzahl(auswertung: UmgebungsAuswertung | null): Kennzahl {
  const [naechstes] = naechsteZiele(auswertung)
  if (!naechstes) {
    return { bezeichnung: 'Nächstes Ziel', wert: '–', zusatz: 'noch nicht geprüft' }
  }
  return { bezeichnung: 'Nächstes Ziel', wert: naechstes.wert, zusatz: naechstes.bezeichnung }
}

function kennzahlen(
  objektart: Objektart,
  masse: GrundstueckMasse | null,
  auswertung: UmgebungsAuswertung | null,
): Kennzahl[] {
  if (masse) {
    return [flaechenKennzahl(masse), umfangsKennzahl(masse), infrastrukturKennzahl(auswertung)]
  }
  return [
    objektartKennzahl(objektart),
    infrastrukturKennzahl(auswertung),
    naechstesZielKennzahl(auswertung),
  ]
}

function objektPunktText(objektart: Objektart): string {
  return objektart.mitGrundstueck ? 'Grundstück' : 'Adresse'
}

function umgebungsAbschnitt(
  objektart: Objektart,
  auswertung: UmgebungsAuswertung,
): UmgebungsAbschnitt {
  const umkreis = formatiereLaenge(auswertung.umkreisM)
  const nummerJeKategorie = new Map(
    nummeriereGefundeneOrte(auswertung.ergebnisse).map(({ ergebnis, nummer }) => [
      ergebnis.kategorie,
      nummer,
    ]),
  )

  return {
    ueberschrift: `Infrastruktur im Umkreis von ${umkreis}`,
    unterzeile: `Luftlinie ab ${luftlinieAb(objektart)} · Stand der Daten ${formatiereDatum(auswertung.stand)}`,
    legende: `Schwarzer Punkt: ${objektPunktText(objektart)} · Nummern: nächster Ort je Kategorie · orange: Hauptstraße`,
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
  objektart,
  adresse,
  masse,
  mittelpunkt,
  auswertung,
  erstelltAm,
}: ExposeDaten): ExposeInhalt {
  const { titel, untertitel } = titelUndUntertitel(objektart, adresse, mittelpunkt)
  return {
    etikett: `Lage-Steckbrief · ${objektart.bezeichnung}`,
    kartenunterschrift: objektart.mitGrundstueck
      ? `Eingezeichnete Grundstücksgrenze · ${KARTENBASIS}`
      : `Lage der Adresse · ${KARTENBASIS}`,
    titel,
    untertitel,
    erstelltAm: `Erstellt am ${formatiereDatum(erstelltAm)}`,
    kennzahlen: kennzahlen(objektart, masse, auswertung),
    naechsteZiele: naechsteZiele(auswertung),
    umgebung: auswertung ? umgebungsAbschnitt(objektart, auswertung) : null,
    hinweis: objektart.mitGrundstueck ? HINWEIS_MIT_GRUNDSTUECK : HINWEIS_AB_ADRESSE,
    quellenangabe: QUELLENANGABE,
    dateiname: dateiname(titel, adresse ? untertitel : '', erstelltAm),
  }
}
