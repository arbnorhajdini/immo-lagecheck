import { area, length, lineString } from '@turf/turf'
import type { Feature, Polygon } from 'geojson'

export type GrundstueckPolygon = Feature<Polygon>

export interface GrundstueckMasse {
  flaecheQm: number
  umfangM: number
}

export function berechneFlaecheQm(grundstueck: GrundstueckPolygon): number {
  return area(grundstueck)
}

export function berechneUmfangM(grundstueck: GrundstueckPolygon): number {
  const [aussengrenze] = grundstueck.geometry.coordinates
  if (!aussengrenze) return 0
  return length(lineString(aussengrenze), { units: 'meters' })
}

export function berechneMasse(grundstueck: GrundstueckPolygon): GrundstueckMasse {
  return {
    flaecheQm: berechneFlaecheQm(grundstueck),
    umfangM: berechneUmfangM(grundstueck),
  }
}
