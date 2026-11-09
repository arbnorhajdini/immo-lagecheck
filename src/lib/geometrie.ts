import {
  area,
  booleanIntersects,
  booleanPointInPolygon,
  centroid,
  distance,
  length,
  lineString,
  point,
  pointToLineDistance,
} from '@turf/turf'
import type { Feature, LineString, Polygon, Position } from 'geojson'
import type { Koordinate, Ortsgeometrie } from '@/types'

export type GrundstueckPolygon = Feature<Polygon>

export type Bezugsobjekt =
  { art: 'grundstueck'; grundstueck: GrundstueckPolygon } | { art: 'adresse'; position: Koordinate }

export interface GrundstueckMasse {
  flaecheQm: number
  umfangM: number
}

const IN_METERN = { units: 'meters' } as const
const MIN_PUNKTE_EINER_LINIE = 2

function alsPosition({ lat, lon }: Koordinate): Position {
  return [lon, lat]
}

export function alsKoordinate(position: Position): Koordinate {
  const [lon, lat] = position as [number, number]
  return { lat, lon }
}

function grundstuecksrand(grundstueck: GrundstueckPolygon): Feature<LineString> | null {
  const [aussengrenze] = grundstueck.geometry.coordinates
  if (!aussengrenze || aussengrenze.length < MIN_PUNKTE_EINER_LINIE) return null
  return lineString(aussengrenze)
}

export function berechneFlaecheQm(grundstueck: GrundstueckPolygon): number {
  return area(grundstueck)
}

export function berechneUmfangM(grundstueck: GrundstueckPolygon): number {
  const rand = grundstuecksrand(grundstueck)
  return rand ? length(rand, IN_METERN) : 0
}

export function berechneMasse(grundstueck: GrundstueckPolygon): GrundstueckMasse {
  return {
    flaecheQm: berechneFlaecheQm(grundstueck),
    umfangM: berechneUmfangM(grundstueck),
  }
}

export function berechneMittelpunkt(grundstueck: GrundstueckPolygon): Koordinate {
  return alsKoordinate(centroid(grundstueck).geometry.coordinates)
}

function abstandZurLinieM(position: Position, linie: Feature<LineString>): number {
  return pointToLineDistance(point(position), linie, IN_METERN)
}

function abstandEinesPunktesM(grundstueck: GrundstueckPolygon, ort: Koordinate): number {
  const rand = grundstuecksrand(grundstueck)
  if (!rand) return Infinity
  const position = alsPosition(ort)
  if (booleanPointInPolygon(point(position), grundstueck)) return 0
  return abstandZurLinieM(position, rand)
}

function abstandEinerLinieM(grundstueck: GrundstueckPolygon, verlauf: Koordinate[]): number {
  const [einzigerPunkt] = verlauf
  if (verlauf.length < MIN_PUNKTE_EINER_LINIE) {
    return einzigerPunkt ? abstandEinesPunktesM(grundstueck, einzigerPunkt) : Infinity
  }

  const rand = grundstuecksrand(grundstueck)
  if (!rand) return Infinity
  const linie = lineString(verlauf.map(alsPosition))
  if (booleanIntersects(linie, grundstueck)) return 0

  const abstaendeDerLinienpunkte = linie.geometry.coordinates.map((p) => abstandZurLinieM(p, rand))
  const abstaendeDerRandpunkte = rand.geometry.coordinates.map((p) => abstandZurLinieM(p, linie))
  return Math.min(...abstaendeDerLinienpunkte, ...abstaendeDerRandpunkte)
}

export function abstandZumGrundstueckM(
  grundstueck: GrundstueckPolygon,
  geometrie: Ortsgeometrie,
): number {
  return geometrie.art === 'punkt'
    ? abstandEinesPunktesM(grundstueck, geometrie.position)
    : abstandEinerLinieM(grundstueck, geometrie.verlauf)
}

function abstandZwischenPunktenM(von: Koordinate, nach: Koordinate): number {
  return distance(point(alsPosition(von)), point(alsPosition(nach)), IN_METERN)
}

function abstandVonAdresseM(adresse: Koordinate, geometrie: Ortsgeometrie): number {
  if (geometrie.art === 'punkt') return abstandZwischenPunktenM(adresse, geometrie.position)
  const [einzigerPunkt] = geometrie.verlauf
  if (geometrie.verlauf.length < MIN_PUNKTE_EINER_LINIE) {
    return einzigerPunkt ? abstandZwischenPunktenM(adresse, einzigerPunkt) : Infinity
  }
  return abstandZurLinieM(alsPosition(adresse), lineString(geometrie.verlauf.map(alsPosition)))
}

export function abstandZumBezugM(bezug: Bezugsobjekt, geometrie: Ortsgeometrie): number {
  return bezug.art === 'grundstueck'
    ? abstandZumGrundstueckM(bezug.grundstueck, geometrie)
    : abstandVonAdresseM(bezug.position, geometrie)
}

export function mittelpunktVon(bezug: Bezugsobjekt): Koordinate {
  return bezug.art === 'grundstueck' ? berechneMittelpunkt(bezug.grundstueck) : bezug.position
}
