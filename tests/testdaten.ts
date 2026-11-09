import type { Bezugsobjekt, GrundstueckPolygon } from '@/lib/geometrie'
import { OBJEKTARTEN, type Objektart, type ObjektartSchluessel } from '@/lib/objektart'
import type { KategorieSchluessel, Koordinate, UmgebungsOrt } from '@/types'

export const KANTENLAENGE_GRAD = 0.001
export const FLAECHE_QUADRAT_QM = 12_364.3
export const UMFANG_QUADRAT_M = 444.78
export const METER_PRO_TAUSENDSTEL_GRAD = 111.195
export const STAND_9_NOVEMBER_2026 = Date.UTC(2026, 10, 9, 12)

export function grundstueckAus(eckpunkte: [number, number][]): GrundstueckPolygon {
  const [ersterEckpunkt] = eckpunkte
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [[...eckpunkte, ersterEckpunkt!]] },
  }
}

export const quadratAmAequator = grundstueckAus([
  [0, 0],
  [KANTENLAENGE_GRAD, 0],
  [KANTENLAENGE_GRAD, KANTENLAENGE_GRAD],
  [0, KANTENLAENGE_GRAD],
])

export function ortAn(
  kategorie: KategorieSchluessel,
  name: string,
  position: Koordinate,
): UmgebungsOrt {
  return { id: `node/${name}`, kategorie, name, geometrie: { art: 'punkt', position } }
}

export function strasseEntlang(name: string, verlauf: Koordinate[]): UmgebungsOrt {
  return {
    id: `way/${name}`,
    kategorie: 'hauptstrasse',
    name,
    geometrie: { art: 'linie', verlauf },
  }
}

export const quadratAlsBezug: Bezugsobjekt = { art: 'grundstueck', grundstueck: quadratAmAequator }

export const adresseInQuadratmitte: Bezugsobjekt = {
  art: 'adresse',
  position: { lat: KANTENLAENGE_GRAD / 2, lon: KANTENLAENGE_GRAD / 2 },
}

function objektart(schluessel: ObjektartSchluessel): Objektart {
  return OBJEKTARTEN.find((art) => art.schluessel === schluessel)!
}

export const HAUS = objektart('haus')
export const WOHNUNG = objektart('wohnung')
export const UNBEBAUTES_GRUNDSTUECK = objektart('grundstueck')
