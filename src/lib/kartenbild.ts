import { alsKoordinate, type GrundstueckPolygon } from '@/lib/geometrie'
import {
  alsBildpunkt,
  begrenzungUmKreis,
  begrenzungVon,
  benoetigteKacheln,
  berechneAusschnitt,
  erweitereBegrenzung,
  type Kachel,
  KACHEL_PX,
  type Kartenausschnitt,
  type Punkt,
  vereinigeBegrenzungen,
} from '@/lib/kachelMathe'
import { verteileMarker } from '@/lib/markerVerteilung'
import type { PdfFarben } from '@/lib/pdfFarben'
import { nummeriereGefundeneOrte, type NummerierterOrt } from '@/lib/umgebung'
import type { Koordinate, UmgebungsAuswertung } from '@/types'

export interface Kartenbild {
  datenUrl: string
  breitePx: number
  hoehePx: number
}

export const BILD_BREITE_PX = 1424
export const BILD_HOEHE_PX = 880
const MAX_KACHEL_ZOOM = 19
const JPEG_QUALITAET = 0.9
const RAND_UM_GRUNDSTUECK_ANTEIL = 0.8
const RAND_UM_ORTEN_ANTEIL = 0.15
const MINDESTRADIUS_UEBERSICHT_M = 500

const GRUNDSTUECK_DECKKRAFT = 0.22
const GRUNDSTUECK_LINIE_PX = 6
const STRASSE_LINIE_PX = 9
const MARKER_RADIUS_PX = 22
const MARKER_RAND_PX = 4
const MARKER_LUECKE_PX = 8
const MARKER_MINDESTABSTAND_PX = 2 * MARKER_RADIUS_PX + MARKER_LUECKE_PX
const FUEHRUNGSLINIE_PX = 2.5
const ORTSPUNKT_RADIUS_PX = 5
const GRUNDSTUECKSPUNKT_RADIUS_PX = 13
const GRUNDSTUECKSPUNKT_KERN_PX = 5
const MARKER_SCHRIFT = 'bold 24px Helvetica, Arial, sans-serif'
const ATTRIBUTION_SCHRIFT = '18px Helvetica, Arial, sans-serif'
const ATTRIBUTION_TEXT = '© OpenStreetMap-Mitwirkende'
const ATTRIBUTION_ABSTAND_PX = 10
const ATTRIBUTION_HOEHE_PX = 30
const ATTRIBUTION_DECKKRAFT = 0.85
const ZIFFER_OPTISCH_ZENTRIERT_PX = 1

interface Zeichenflaeche {
  leinwand: HTMLCanvasElement
  kontext: CanvasRenderingContext2D
  ausschnitt: Kartenausschnitt
  farben: PdfFarben
}

function kachelUrl({ zoom, x, y }: Kachel): string {
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`
}

async function ladeKachelbild(kachel: Kachel): Promise<ImageBitmap | null> {
  try {
    const antwort = await fetch(kachelUrl(kachel), { mode: 'cors' })
    return antwort.ok ? await createImageBitmap(await antwort.blob()) : null
  } catch {
    return null
  }
}

function erstelleZeichenflaeche(ausschnitt: Kartenausschnitt, farben: PdfFarben): Zeichenflaeche {
  const leinwand = document.createElement('canvas')
  leinwand.width = ausschnitt.breitePx
  leinwand.height = ausschnitt.hoehePx
  const kontext = leinwand.getContext('2d')
  if (!kontext) throw new Error('Canvas wird von diesem Browser nicht unterstützt')
  return { leinwand, kontext, ausschnitt, farben }
}

async function zeichneKacheln({ kontext, ausschnitt, farben }: Zeichenflaeche): Promise<void> {
  const kacheln = benoetigteKacheln(ausschnitt)
  const bilder = await Promise.all(kacheln.map(ladeKachelbild))
  kacheln.forEach((kachel, index) => {
    const bild = bilder[index]
    if (bild) {
      kontext.drawImage(bild, kachel.zielX, kachel.zielY, KACHEL_PX, KACHEL_PX)
    } else {
      kontext.fillStyle = farben.fehlendeKachel
      kontext.fillRect(kachel.zielX, kachel.zielY, KACHEL_PX, KACHEL_PX)
    }
  })
}

function aussengrenze(grundstueck: GrundstueckPolygon): Koordinate[] {
  const [ring = []] = grundstueck.geometry.coordinates
  return ring.map(alsKoordinate)
}

function zeichneLinienzug({ kontext, ausschnitt }: Zeichenflaeche, koordinaten: Koordinate[]) {
  kontext.beginPath()
  koordinaten.forEach((koordinate, index) => {
    const { x, y } = alsBildpunkt(koordinate, ausschnitt)
    if (index === 0) kontext.moveTo(x, y)
    else kontext.lineTo(x, y)
  })
}

function zeichneGrundstueck(flaeche: Zeichenflaeche, grundstueck: GrundstueckPolygon): void {
  const { kontext, farben } = flaeche
  zeichneLinienzug(flaeche, aussengrenze(grundstueck))
  kontext.closePath()
  kontext.globalAlpha = GRUNDSTUECK_DECKKRAFT
  kontext.fillStyle = farben.grundstueckFuellung
  kontext.fill()
  kontext.globalAlpha = 1
  kontext.lineWidth = GRUNDSTUECK_LINIE_PX
  kontext.lineJoin = 'round'
  kontext.strokeStyle = farben.grundstueckRand
  kontext.stroke()
}

function zeichneStrasse(flaeche: Zeichenflaeche, verlauf: Koordinate[]): void {
  const { kontext, farben } = flaeche
  zeichneLinienzug(flaeche, verlauf)
  kontext.lineWidth = STRASSE_LINIE_PX
  kontext.lineCap = 'round'
  kontext.strokeStyle = farben.strasse
  kontext.stroke()
}

function quadratischerAbstand(a: Koordinate, b: Koordinate): number {
  const laengenfaktor = Math.cos((a.lat * Math.PI) / 180)
  return (a.lat - b.lat) ** 2 + ((a.lon - b.lon) * laengenfaktor) ** 2
}

function markerKoordinate({ naechsterOrt }: NummerierterOrt, bezug: Koordinate): Koordinate {
  const { geometrie } = naechsterOrt.ort
  if (geometrie.art === 'punkt') return geometrie.position
  return geometrie.verlauf.reduce((naechster, koordinate) =>
    quadratischerAbstand(koordinate, bezug) < quadratischerAbstand(naechster, bezug)
      ? koordinate
      : naechster,
  )
}

function zeichneFuehrungslinie({ kontext, farben }: Zeichenflaeche, von: Punkt, nach: Punkt) {
  if (von.x === nach.x && von.y === nach.y) return
  kontext.beginPath()
  kontext.moveTo(von.x, von.y)
  kontext.lineTo(nach.x, nach.y)
  kontext.lineWidth = FUEHRUNGSLINIE_PX
  kontext.strokeStyle = farben.primaer
  kontext.stroke()
  kontext.beginPath()
  kontext.arc(von.x, von.y, ORTSPUNKT_RADIUS_PX, 0, 2 * Math.PI)
  kontext.fillStyle = farben.primaer
  kontext.fill()
}

function zeichneGrundstueckspunkt({ kontext, farben }: Zeichenflaeche, punkt: Punkt): void {
  kontext.beginPath()
  kontext.arc(punkt.x, punkt.y, GRUNDSTUECKSPUNKT_RADIUS_PX, 0, 2 * Math.PI)
  kontext.fillStyle = farben.text
  kontext.fill()
  kontext.lineWidth = MARKER_RAND_PX
  kontext.strokeStyle = farben.primaerKontrast
  kontext.stroke()
  kontext.beginPath()
  kontext.arc(punkt.x, punkt.y, GRUNDSTUECKSPUNKT_KERN_PX, 0, 2 * Math.PI)
  kontext.fillStyle = farben.primaerKontrast
  kontext.fill()
}

function zeichneNummernmarker({ kontext, farben }: Zeichenflaeche, punkt: Punkt, nummer: number) {
  kontext.beginPath()
  kontext.arc(punkt.x, punkt.y, MARKER_RADIUS_PX, 0, 2 * Math.PI)
  kontext.fillStyle = farben.primaer
  kontext.fill()
  kontext.lineWidth = MARKER_RAND_PX
  kontext.strokeStyle = farben.primaerKontrast
  kontext.stroke()
  kontext.fillStyle = farben.primaerKontrast
  kontext.font = MARKER_SCHRIFT
  kontext.textAlign = 'center'
  kontext.textBaseline = 'middle'
  kontext.fillText(String(nummer), punkt.x, punkt.y + ZIFFER_OPTISCH_ZENTRIERT_PX)
}

function zeichneAttribution({ kontext, ausschnitt, farben }: Zeichenflaeche): void {
  kontext.font = ATTRIBUTION_SCHRIFT
  const textBreite = kontext.measureText(ATTRIBUTION_TEXT).width
  const x = ausschnitt.breitePx - textBreite - 2 * ATTRIBUTION_ABSTAND_PX
  const y = ausschnitt.hoehePx - ATTRIBUTION_HOEHE_PX
  kontext.globalAlpha = ATTRIBUTION_DECKKRAFT
  kontext.fillStyle = farben.primaerKontrast
  kontext.fillRect(x, y, textBreite + 2 * ATTRIBUTION_ABSTAND_PX, ATTRIBUTION_HOEHE_PX)
  kontext.globalAlpha = 1
  kontext.fillStyle = farben.text
  kontext.textAlign = 'left'
  kontext.textBaseline = 'middle'
  kontext.fillText(ATTRIBUTION_TEXT, x + ATTRIBUTION_ABSTAND_PX, y + ATTRIBUTION_HOEHE_PX / 2)
}

function alsKartenbild({ leinwand, ausschnitt }: Zeichenflaeche): Kartenbild {
  return {
    datenUrl: leinwand.toDataURL('image/jpeg', JPEG_QUALITAET),
    breitePx: ausschnitt.breitePx,
    hoehePx: ausschnitt.hoehePx,
  }
}

export async function zeichneGrundstueckskarte(
  grundstueck: GrundstueckPolygon,
  farben: PdfFarben,
): Promise<Kartenbild> {
  const begrenzung = erweitereBegrenzung(
    begrenzungVon(aussengrenze(grundstueck)),
    RAND_UM_GRUNDSTUECK_ANTEIL,
  )
  const ausschnitt = berechneAusschnitt(begrenzung, BILD_BREITE_PX, BILD_HOEHE_PX, MAX_KACHEL_ZOOM)
  const flaeche = erstelleZeichenflaeche(ausschnitt, farben)

  await zeichneKacheln(flaeche)
  zeichneGrundstueck(flaeche, grundstueck)
  zeichneAttribution(flaeche)
  return alsKartenbild(flaeche)
}

function uebersichtsBegrenzung(mittelpunkt: Koordinate, ortsKoordinaten: Koordinate[]) {
  const mindestens = begrenzungUmKreis(mittelpunkt, MINDESTRADIUS_UEBERSICHT_M)
  if (ortsKoordinaten.length === 0) return mindestens
  const umOrte = erweitereBegrenzung(
    begrenzungVon([mittelpunkt, ...ortsKoordinaten]),
    RAND_UM_ORTEN_ANTEIL,
  )
  return vereinigeBegrenzungen(mindestens, umOrte)
}

export async function zeichneUmgebungskarte(
  grundstueck: GrundstueckPolygon,
  auswertung: UmgebungsAuswertung,
  farben: PdfFarben,
): Promise<Kartenbild> {
  const { mittelpunkt, ergebnisse } = auswertung
  const gefundeneOrte = nummeriereGefundeneOrte(ergebnisse)
  const ortsKoordinaten = gefundeneOrte.map((ort) => markerKoordinate(ort, mittelpunkt))
  const ausschnitt = berechneAusschnitt(
    uebersichtsBegrenzung(mittelpunkt, ortsKoordinaten),
    BILD_BREITE_PX,
    BILD_HOEHE_PX,
    MAX_KACHEL_ZOOM,
  )
  const flaeche = erstelleZeichenflaeche(ausschnitt, farben)
  const grundstueckspunkt = alsBildpunkt(mittelpunkt, ausschnitt)
  const echtePositionen = ortsKoordinaten.map((koordinate) => alsBildpunkt(koordinate, ausschnitt))
  const markerPositionen = verteileMarker(echtePositionen, MARKER_MINDESTABSTAND_PX, [
    grundstueckspunkt,
  ])

  await zeichneKacheln(flaeche)
  for (const { naechsterOrt } of gefundeneOrte) {
    const { geometrie } = naechsterOrt.ort
    if (geometrie.art === 'linie') zeichneStrasse(flaeche, geometrie.verlauf)
  }
  zeichneGrundstueck(flaeche, grundstueck)
  zeichneGrundstueckspunkt(flaeche, grundstueckspunkt)
  gefundeneOrte.forEach((ort, index) => {
    const echt = echtePositionen[index]
    const marker = markerPositionen[index]
    if (!echt || !marker) return
    zeichneFuehrungslinie(flaeche, echt, marker)
    zeichneNummernmarker(flaeche, marker, ort.nummer)
  })
  zeichneAttribution(flaeche)
  return alsKartenbild(flaeche)
}
