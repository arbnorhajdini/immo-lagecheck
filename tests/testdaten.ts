import type { GrundstueckPolygon } from '@/lib/geometrie'
import type { KategorieSchluessel, Koordinate, UmgebungsOrt } from '@/types'

export const KANTENLAENGE_GRAD = 0.001
export const FLAECHE_QUADRAT_QM = 12_364.3
export const UMFANG_QUADRAT_M = 444.78
export const METER_PRO_TAUSENDSTEL_GRAD = 111.195

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
