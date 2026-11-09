import type { Begrenzung, Koordinate } from '@/types'

export const KACHEL_PX = 256
const ERDUMFANG_AM_AEQUATOR_M = 40_075_016.686
const GRAD_PRO_RADIANT = 180 / Math.PI

export interface Punkt {
  x: number
  y: number
}

export interface Kachel {
  x: number
  y: number
  zoom: number
  zielX: number
  zielY: number
}

export interface Kartenausschnitt {
  zoom: number
  ursprung: Punkt
  breitePx: number
  hoehePx: number
}

function weltgroessePx(zoom: number): number {
  return KACHEL_PX * 2 ** zoom
}

export function alsWeltpixel({ lat, lon }: Koordinate, zoom: number): Punkt {
  const breitengradRad = lat / GRAD_PRO_RADIANT
  const groesse = weltgroessePx(zoom)
  return {
    x: ((lon + 180) / 360) * groesse,
    y:
      ((1 - Math.log(Math.tan(breitengradRad) + 1 / Math.cos(breitengradRad)) / Math.PI) / 2) *
      groesse,
  }
}

export function alsBildpunkt(koordinate: Koordinate, ausschnitt: Kartenausschnitt): Punkt {
  const welt = alsWeltpixel(koordinate, ausschnitt.zoom)
  return { x: welt.x - ausschnitt.ursprung.x, y: welt.y - ausschnitt.ursprung.y }
}

function passtInBild(begrenzung: Begrenzung, zoom: number, breitePx: number, hoehePx: number) {
  const nordwest = alsWeltpixel({ lat: begrenzung.nord, lon: begrenzung.west }, zoom)
  const suedost = alsWeltpixel({ lat: begrenzung.sued, lon: begrenzung.ost }, zoom)
  return suedost.x - nordwest.x <= breitePx && suedost.y - nordwest.y <= hoehePx
}

export function passenderZoom(
  begrenzung: Begrenzung,
  breitePx: number,
  hoehePx: number,
  maxZoom: number,
): number {
  for (let zoom = maxZoom; zoom > 0; zoom--) {
    if (passtInBild(begrenzung, zoom, breitePx, hoehePx)) return zoom
  }
  return 0
}

export function berechneAusschnitt(
  begrenzung: Begrenzung,
  breitePx: number,
  hoehePx: number,
  maxZoom: number,
): Kartenausschnitt {
  const zoom = passenderZoom(begrenzung, breitePx, hoehePx, maxZoom)
  const mitte = alsWeltpixel(
    { lat: (begrenzung.nord + begrenzung.sued) / 2, lon: (begrenzung.west + begrenzung.ost) / 2 },
    zoom,
  )
  return {
    zoom,
    ursprung: { x: Math.round(mitte.x - breitePx / 2), y: Math.round(mitte.y - hoehePx / 2) },
    breitePx,
    hoehePx,
  }
}

export function benoetigteKacheln({ zoom, ursprung, breitePx, hoehePx }: Kartenausschnitt) {
  const ersteSpalte = Math.floor(ursprung.x / KACHEL_PX)
  const letzteSpalte = Math.floor((ursprung.x + breitePx - 1) / KACHEL_PX)
  const ersteZeile = Math.floor(ursprung.y / KACHEL_PX)
  const letzteZeile = Math.floor((ursprung.y + hoehePx - 1) / KACHEL_PX)

  const kacheln: Kachel[] = []
  for (let y = ersteZeile; y <= letzteZeile; y++) {
    for (let x = ersteSpalte; x <= letzteSpalte; x++) {
      kacheln.push({
        x,
        y,
        zoom,
        zielX: x * KACHEL_PX - ursprung.x,
        zielY: y * KACHEL_PX - ursprung.y,
      })
    }
  }
  return kacheln
}

export function erweitereBegrenzung(begrenzung: Begrenzung, anteil: number): Begrenzung {
  const breite = begrenzung.ost - begrenzung.west
  const hoehe = begrenzung.nord - begrenzung.sued
  return {
    sued: begrenzung.sued - hoehe * anteil,
    west: begrenzung.west - breite * anteil,
    nord: begrenzung.nord + hoehe * anteil,
    ost: begrenzung.ost + breite * anteil,
  }
}

export function begrenzungUmKreis(mittelpunkt: Koordinate, radiusM: number): Begrenzung {
  const meterProGradBreite = ERDUMFANG_AM_AEQUATOR_M / 360
  const breitenAbstand = radiusM / meterProGradBreite
  const laengenAbstand = breitenAbstand / Math.cos(mittelpunkt.lat / GRAD_PRO_RADIANT)
  return {
    sued: mittelpunkt.lat - breitenAbstand,
    west: mittelpunkt.lon - laengenAbstand,
    nord: mittelpunkt.lat + breitenAbstand,
    ost: mittelpunkt.lon + laengenAbstand,
  }
}

export function begrenzungVon(koordinaten: Koordinate[]): Begrenzung {
  const breiten = koordinaten.map(({ lat }) => lat)
  const laengen = koordinaten.map(({ lon }) => lon)
  return {
    sued: Math.min(...breiten),
    west: Math.min(...laengen),
    nord: Math.max(...breiten),
    ost: Math.max(...laengen),
  }
}

export function vereinigeBegrenzungen(a: Begrenzung, b: Begrenzung): Begrenzung {
  return {
    sued: Math.min(a.sued, b.sued),
    west: Math.min(a.west, b.west),
    nord: Math.max(a.nord, b.nord),
    ost: Math.max(a.ost, b.ost),
  }
}
