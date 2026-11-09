import type { jsPDF } from 'jspdf'
import type { ExposeInhalt, Kennzahl, UmgebungsZeile } from '@/lib/exposeInhalt'
import { BILD_BREITE_PX, BILD_HOEHE_PX, type Kartenbild } from '@/lib/kartenbild'
import type { PdfFarben } from '@/lib/pdfFarben'
import { alsPdfText } from '@/lib/pdfText'

export interface ExposeKarten {
  grundstueck: Kartenbild
  umgebung: Kartenbild | null
}

const SEITE_BREITE_MM = 210
const SEITE_HOEHE_MM = 297
const RAND_MM = 16
const INHALT_BREITE_MM = SEITE_BREITE_MM - 2 * RAND_MM
const RECHTE_KANTE_MM = SEITE_BREITE_MM - RAND_MM
const KARTE_HOEHE_MM = (INHALT_BREITE_MM * BILD_HOEHE_PX) / BILD_BREITE_PX

const SCHRIFTART = 'helvetica'
const AKZENTLEISTE_MM = 3
const ETIKETT_Y_MM = 15
const ETIKETT_ZEICHENABSTAND = 0.8
const TITEL_ZEILENHOEHE_MM = 9
const ABSTAND_KLEIN_MM = 3
const ABSTAND_MITTEL_MM = 6
const ABSTAND_GROSS_MM = 10
const ECKENRADIUS_MM = 2.5
const DUENNE_LINIE_MM = 0.2

const KACHEL_ABSTAND_MM = 5
const KACHEL_HOEHE_MM = 27
const ZIELE_SPALTEN = 4
const ZIEL_HOEHE_MM = 20

const TABELLE_ZEILENHOEHE_MM = 11
const NUMMER_RADIUS_MM = 3.3
const TABELLE_TEXT_EINZUG_MM = 11
const ENTFERNUNG_SPALTE_MM = 28

const FUSSZEILE_LINIE_Y_MM = SEITE_HOEHE_MM - 14
const FUSSZEILE_TEXT_Y_MM = SEITE_HOEHE_MM - 10
const HINWEIS_HOEHE_MM = 18
const HINWEIS_Y_MM = FUSSZEILE_LINIE_Y_MM - HINWEIS_HOEHE_MM - ABSTAND_MITTEL_MM
const INNENABSTAND_MM = 4
const HINWEIS_TEXT_VERSATZ_MM = 5
const ZIEL_TRENNLINIE_KUERZER_MM = 4

const KACHEL_TEXT_VERSATZ_MM = { bezeichnung: 4, wert: 10, zusatz: 20 } as const
const ZIEL_TEXT_VERSATZ_MM = { bezeichnung: 0, wert: 4.5, name: 11.5 } as const
const ZEILE_TEXT_VERSATZ_MM = { kategorie: 1.6, name: 6.2 } as const
const AUSLASSUNG = '…'

const SCHRIFTGROESSE = {
  etikett: 8,
  titel: 24,
  untertitel: 12,
  abschnitt: 13,
  text: 10,
  klein: 8.5,
  winzig: 7.5,
  kennzahl: 18,
  ziel: 14,
  entfernung: 11,
  nummer: 8,
} as const

type Schriftstil = 'normal' | 'bold'

interface Zeichner {
  pdf: jsPDF
  farben: PdfFarben
}

function setzeSchrift(
  { pdf }: Zeichner,
  groessePt: number,
  farbe: string,
  stil: Schriftstil = 'normal',
): void {
  pdf.setFont(SCHRIFTART, stil)
  pdf.setFontSize(groessePt)
  pdf.setTextColor(farbe)
}

function schreibe(
  { pdf }: Zeichner,
  text: string,
  x: number,
  y: number,
  ausrichtung: 'left' | 'right' | 'center' = 'left',
): void {
  pdf.text(alsPdfText(text), x, y, { baseline: 'top', align: ausrichtung })
}

function kuerzeAufBreite({ pdf }: Zeichner, text: string, maxBreiteMm: number): string {
  const sicher = alsPdfText(text)
  if (pdf.getTextWidth(sicher) <= maxBreiteMm) return sicher
  let gekuerzt = sicher
  while (gekuerzt.length > 0 && pdf.getTextWidth(gekuerzt + AUSLASSUNG) > maxBreiteMm) {
    gekuerzt = gekuerzt.slice(0, -1)
  }
  return gekuerzt.trimEnd() + AUSLASSUNG
}

function zeichneKopf(
  zeichner: Zeichner,
  etikett: string,
  titel: string,
  untertitel: string,
  rechts: string,
): number {
  const { pdf, farben } = zeichner
  pdf.setFillColor(farben.primaer)
  pdf.rect(0, 0, SEITE_BREITE_MM, AKZENTLEISTE_MM, 'F')

  setzeSchrift(zeichner, SCHRIFTGROESSE.etikett, farben.primaer, 'bold')
  pdf.text(etikett.toUpperCase(), RAND_MM, ETIKETT_Y_MM, {
    baseline: 'top',
    charSpace: ETIKETT_ZEICHENABSTAND,
  })
  setzeSchrift(zeichner, SCHRIFTGROESSE.etikett, farben.textGedaempft)
  schreibe(zeichner, rechts, RECHTE_KANTE_MM, ETIKETT_Y_MM, 'right')

  setzeSchrift(zeichner, SCHRIFTGROESSE.titel, farben.text, 'bold')
  const titelZeilen: string[] = pdf.splitTextToSize(alsPdfText(titel), INHALT_BREITE_MM)
  let y = ETIKETT_Y_MM + ABSTAND_MITTEL_MM
  for (const zeile of titelZeilen) {
    pdf.text(zeile, RAND_MM, y, { baseline: 'top' })
    y += TITEL_ZEILENHOEHE_MM
  }

  if (untertitel) {
    setzeSchrift(zeichner, SCHRIFTGROESSE.untertitel, farben.textGedaempft)
    schreibe(zeichner, untertitel, RAND_MM, y)
    y += ABSTAND_MITTEL_MM
  }
  return y + ABSTAND_MITTEL_MM
}

function zeichneKarte(zeichner: Zeichner, bild: Kartenbild, y: number, unterschrift: string) {
  const { pdf, farben } = zeichner
  pdf.addImage(bild.datenUrl, 'JPEG', RAND_MM, y, INHALT_BREITE_MM, KARTE_HOEHE_MM)
  pdf.setDrawColor(farben.rahmen)
  pdf.setLineWidth(DUENNE_LINIE_MM)
  pdf.rect(RAND_MM, y, INHALT_BREITE_MM, KARTE_HOEHE_MM, 'S')

  const unterschriftY = y + KARTE_HOEHE_MM + ABSTAND_KLEIN_MM
  setzeSchrift(zeichner, SCHRIFTGROESSE.winzig, farben.textGedaempft)
  schreibe(zeichner, unterschrift, RAND_MM, unterschriftY)
  return unterschriftY + ABSTAND_GROSS_MM
}

function zeichneKachel(
  zeichner: Zeichner,
  kennzahl: Kennzahl,
  x: number,
  y: number,
  breite: number,
) {
  const { pdf, farben } = zeichner
  const innen = x + INNENABSTAND_MM
  const textBreite = breite - 2 * INNENABSTAND_MM
  pdf.setFillColor(farben.flaeche)
  pdf.roundedRect(x, y, breite, KACHEL_HOEHE_MM, ECKENRADIUS_MM, ECKENRADIUS_MM, 'F')

  setzeSchrift(zeichner, SCHRIFTGROESSE.klein, farben.textGedaempft)
  schreibe(zeichner, kennzahl.bezeichnung, innen, y + KACHEL_TEXT_VERSATZ_MM.bezeichnung)
  setzeSchrift(zeichner, SCHRIFTGROESSE.kennzahl, farben.text, 'bold')
  schreibe(zeichner, kennzahl.wert, innen, y + KACHEL_TEXT_VERSATZ_MM.wert)
  setzeSchrift(zeichner, SCHRIFTGROESSE.winzig, farben.textGedaempft)
  pdf.text(
    kuerzeAufBreite(zeichner, kennzahl.zusatz, textBreite),
    innen,
    y + KACHEL_TEXT_VERSATZ_MM.zusatz,
    {
      baseline: 'top',
    },
  )
}

function zeichneKennzahlen(zeichner: Zeichner, kennzahlen: Kennzahl[], y: number): number {
  const breite =
    (INHALT_BREITE_MM - (kennzahlen.length - 1) * KACHEL_ABSTAND_MM) / kennzahlen.length
  kennzahlen.forEach((kennzahl, index) => {
    zeichneKachel(zeichner, kennzahl, RAND_MM + index * (breite + KACHEL_ABSTAND_MM), y, breite)
  })
  return y + KACHEL_HOEHE_MM + ABSTAND_GROSS_MM
}

function zeichneAbschnittstitel(zeichner: Zeichner, titel: string, y: number): number {
  setzeSchrift(zeichner, SCHRIFTGROESSE.abschnitt, zeichner.farben.text, 'bold')
  schreibe(zeichner, titel, RAND_MM, y)
  return y + ABSTAND_MITTEL_MM + ABSTAND_KLEIN_MM
}

function zeichneNaechsteZiele(zeichner: Zeichner, ziele: Kennzahl[], y: number): number {
  if (ziele.length === 0) return y
  const { pdf, farben } = zeichner
  const inhaltY = zeichneAbschnittstitel(zeichner, 'Das Wichtigste in der Nähe', y)
  const spaltenbreite = INHALT_BREITE_MM / ZIELE_SPALTEN

  ziele.forEach((ziel, index) => {
    const x = RAND_MM + index * spaltenbreite
    if (index > 0) {
      pdf.setDrawColor(farben.rahmen)
      pdf.setLineWidth(DUENNE_LINIE_MM)
      pdf.line(
        x - ABSTAND_KLEIN_MM,
        inhaltY,
        x - ABSTAND_KLEIN_MM,
        inhaltY + ZIEL_HOEHE_MM - ZIEL_TRENNLINIE_KUERZER_MM,
      )
    }
    setzeSchrift(zeichner, SCHRIFTGROESSE.klein, farben.textGedaempft)
    schreibe(zeichner, ziel.bezeichnung, x, inhaltY + ZIEL_TEXT_VERSATZ_MM.bezeichnung)
    setzeSchrift(zeichner, SCHRIFTGROESSE.ziel, farben.primaer, 'bold')
    schreibe(zeichner, ziel.wert, x, inhaltY + ZIEL_TEXT_VERSATZ_MM.wert)
    setzeSchrift(zeichner, SCHRIFTGROESSE.winzig, farben.textGedaempft)
    const nameBreite = spaltenbreite - 2 * ABSTAND_KLEIN_MM
    pdf.text(
      kuerzeAufBreite(zeichner, ziel.zusatz, nameBreite),
      x,
      inhaltY + ZIEL_TEXT_VERSATZ_MM.name,
      {
        baseline: 'top',
      },
    )
  })
  return inhaltY + ZIEL_HOEHE_MM
}

function zeichneHinweis(zeichner: Zeichner, hinweis: string): void {
  const { pdf, farben } = zeichner
  pdf.setFillColor(farben.flaeche)
  pdf.roundedRect(
    RAND_MM,
    HINWEIS_Y_MM,
    INHALT_BREITE_MM,
    HINWEIS_HOEHE_MM,
    ECKENRADIUS_MM,
    ECKENRADIUS_MM,
    'F',
  )
  const innen = RAND_MM + INNENABSTAND_MM
  setzeSchrift(zeichner, SCHRIFTGROESSE.klein, farben.text, 'bold')
  schreibe(zeichner, 'Hinweis', innen, HINWEIS_Y_MM + INNENABSTAND_MM)
  setzeSchrift(zeichner, SCHRIFTGROESSE.winzig, farben.textGedaempft)
  const zeilen: string[] = pdf.splitTextToSize(
    alsPdfText(hinweis),
    INHALT_BREITE_MM - 2 * INNENABSTAND_MM,
  )
  pdf.text(zeilen, innen, HINWEIS_Y_MM + INNENABSTAND_MM + HINWEIS_TEXT_VERSATZ_MM, {
    baseline: 'top',
  })
}

function zeichneNummer(zeichner: Zeichner, nummer: number | null, x: number, y: number): void {
  const { pdf, farben } = zeichner
  if (nummer === null) {
    pdf.setDrawColor(farben.rahmen)
    pdf.setLineWidth(DUENNE_LINIE_MM * 2)
    pdf.circle(x, y, NUMMER_RADIUS_MM, 'S')
    return
  }
  pdf.setFillColor(farben.primaer)
  pdf.circle(x, y, NUMMER_RADIUS_MM, 'F')
  setzeSchrift(zeichner, SCHRIFTGROESSE.nummer, farben.primaerKontrast, 'bold')
  pdf.text(String(nummer), x, y, { baseline: 'middle', align: 'center' })
}

function zeichneTabellenzeile(zeichner: Zeichner, zeile: UmgebungsZeile, y: number): void {
  const { pdf, farben } = zeichner
  const mitte = y + TABELLE_ZEILENHOEHE_MM / 2
  const textX = RAND_MM + TABELLE_TEXT_EINZUG_MM
  const nameBreite = INHALT_BREITE_MM - TABELLE_TEXT_EINZUG_MM - ENTFERNUNG_SPALTE_MM
  const gefunden = zeile.nummer !== null

  zeichneNummer(zeichner, zeile.nummer, RAND_MM + NUMMER_RADIUS_MM, mitte)
  setzeSchrift(zeichner, SCHRIFTGROESSE.text, gefunden ? farben.text : farben.textGedaempft, 'bold')
  schreibe(zeichner, zeile.kategorie, textX, y + ZEILE_TEXT_VERSATZ_MM.kategorie)
  setzeSchrift(zeichner, SCHRIFTGROESSE.klein, farben.textGedaempft)
  pdf.text(
    kuerzeAufBreite(zeichner, zeile.name, nameBreite),
    textX,
    y + ZEILE_TEXT_VERSATZ_MM.name,
    {
      baseline: 'top',
    },
  )

  setzeSchrift(
    zeichner,
    SCHRIFTGROESSE.entfernung,
    gefunden ? farben.text : farben.textGedaempft,
    'bold',
  )
  pdf.text(alsPdfText(zeile.entfernung), RECHTE_KANTE_MM, mitte, {
    baseline: 'middle',
    align: 'right',
  })

  pdf.setDrawColor(farben.rahmen)
  pdf.setLineWidth(DUENNE_LINIE_MM)
  pdf.line(RAND_MM, y + TABELLE_ZEILENHOEHE_MM, RECHTE_KANTE_MM, y + TABELLE_ZEILENHOEHE_MM)
}

function zeichneUmgebungstabelle(zeichner: Zeichner, zeilen: UmgebungsZeile[], y: number) {
  zeilen.forEach((zeile, index) => {
    zeichneTabellenzeile(zeichner, zeile, y + index * TABELLE_ZEILENHOEHE_MM)
  })
}

function zeichneFusszeile(zeichner: Zeichner, quelle: string, seite: number, seiten: number) {
  const { pdf, farben } = zeichner
  pdf.setDrawColor(farben.rahmen)
  pdf.setLineWidth(DUENNE_LINIE_MM)
  pdf.line(RAND_MM, FUSSZEILE_LINIE_Y_MM, RECHTE_KANTE_MM, FUSSZEILE_LINIE_Y_MM)
  setzeSchrift(zeichner, SCHRIFTGROESSE.winzig, farben.textGedaempft)
  schreibe(zeichner, quelle, RAND_MM, FUSSZEILE_TEXT_Y_MM)
  schreibe(zeichner, `Seite ${seite} von ${seiten}`, RECHTE_KANTE_MM, FUSSZEILE_TEXT_Y_MM, 'right')
}

function zeichneGrundstuecksseite(zeichner: Zeichner, inhalt: ExposeInhalt, karte: Kartenbild) {
  const kopfEnde = zeichneKopf(
    zeichner,
    'Lage-Steckbrief',
    inhalt.titel,
    inhalt.untertitel,
    inhalt.erstelltAm,
  )
  const karteEnde = zeichneKarte(
    zeichner,
    karte,
    kopfEnde,
    'Eingezeichnete Grundstücksgrenze · Kartenbasis © OpenStreetMap-Mitwirkende',
  )
  const kennzahlenEnde = zeichneKennzahlen(zeichner, inhalt.kennzahlen, karteEnde)
  zeichneNaechsteZiele(zeichner, inhalt.naechsteZiele, kennzahlenEnde)
  zeichneHinweis(zeichner, inhalt.hinweis)
}

function zeichneUmgebungsseite(zeichner: Zeichner, inhalt: ExposeInhalt, karte: Kartenbild) {
  if (!inhalt.umgebung) return
  const { ueberschrift, unterzeile, legende, zeilen } = inhalt.umgebung
  const kopfEnde = zeichneKopf(zeichner, 'Umgebung', ueberschrift, unterzeile, inhalt.titel)
  const karteEnde = zeichneKarte(zeichner, karte, kopfEnde, legende)
  zeichneUmgebungstabelle(zeichner, zeilen, karteEnde - ABSTAND_KLEIN_MM)
}

export async function baueExposePdf(
  inhalt: ExposeInhalt,
  karten: ExposeKarten,
  farben: PdfFarben,
): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  const zeichner: Zeichner = { pdf, farben }
  const mitUmgebungsseite = inhalt.umgebung !== null && karten.umgebung !== null
  const seiten = mitUmgebungsseite ? 2 : 1

  pdf.setProperties({ title: `Lage-Steckbrief ${inhalt.titel}`, subject: inhalt.untertitel })
  zeichneGrundstuecksseite(zeichner, inhalt, karten.grundstueck)
  zeichneFusszeile(zeichner, inhalt.quellenangabe, 1, seiten)

  if (mitUmgebungsseite && karten.umgebung) {
    pdf.addPage()
    zeichneUmgebungsseite(zeichner, inhalt, karten.umgebung)
    zeichneFusszeile(zeichner, inhalt.quellenangabe, 2, seiten)
  }
  return pdf
}
