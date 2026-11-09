import { describe, expect, it } from 'vitest'
import {
  berechneFlaecheQm,
  berechneMasse,
  berechneUmfangM,
  type GrundstueckPolygon,
} from '@/lib/geometrie'

function grundstueckAus(eckpunkte: [number, number][]): GrundstueckPolygon {
  const [ersterEckpunkt] = eckpunkte
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [[...eckpunkte, ersterEckpunkt!]] },
  }
}

const quadratAmAequator = grundstueckAus([
  [0, 0],
  [0.001, 0],
  [0.001, 0.001],
  [0, 0.001],
])

describe('berechneFlaecheQm', () => {
  it('berechnet die Fläche eines Quadrats mit rund 111 m Kantenlänge', () => {
    expect(berechneFlaecheQm(quadratAmAequator)).toBeCloseTo(12_364.3, 0)
  })

  it('liefert für ein Dreieck die halbe Fläche des Quadrats', () => {
    const halbesQuadrat = grundstueckAus([
      [0, 0],
      [0.001, 0],
      [0.001, 0.001],
    ])

    expect(berechneFlaecheQm(halbesQuadrat)).toBeCloseTo(12_364.3 / 2, 0)
  })
})

describe('berechneUmfangM', () => {
  it('summiert alle vier Kanten des Quadrats', () => {
    expect(berechneUmfangM(quadratAmAequator)).toBeCloseTo(444.78, 1)
  })

  it('liefert 0 für ein Polygon ohne Außengrenze', () => {
    const ohneAussengrenze: GrundstueckPolygon = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [] },
    }

    expect(berechneUmfangM(ohneAussengrenze)).toBe(0)
  })
})

describe('berechneMasse', () => {
  it('fasst Fläche und Umfang zusammen', () => {
    const masse = berechneMasse(quadratAmAequator)

    expect(masse.flaecheQm).toBeCloseTo(12_364.3, 0)
    expect(masse.umfangM).toBeCloseTo(444.78, 1)
  })
})
