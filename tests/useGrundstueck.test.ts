import { describe, expect, it } from 'vitest'
import { useGrundstueck } from '@/composables/useGrundstueck'
import type { GrundstueckPolygon } from '@/lib/geometrie'

const quadratAmAequator: GrundstueckPolygon = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [0.001, 0],
        [0.001, 0.001],
        [0, 0.001],
        [0, 0],
      ],
    ],
  },
}

describe('useGrundstueck', () => {
  it('hat ohne Grundstück keine Maße', () => {
    const { masse } = useGrundstueck()

    expect(masse.value).toBeNull()
  })

  it('berechnet die Maße, sobald ein Grundstück gezeichnet ist', () => {
    const { grundstueck, masse } = useGrundstueck()

    grundstueck.value = quadratAmAequator

    expect(masse.value?.flaecheQm).toBeCloseTo(12_364.3, 0)
    expect(masse.value?.umfangM).toBeCloseTo(444.78, 1)
  })

  it('verwirft die Maße, wenn das Grundstück entfernt wird', () => {
    const { grundstueck, masse, entferneGrundstueck } = useGrundstueck()
    grundstueck.value = quadratAmAequator

    entferneGrundstueck()

    expect(grundstueck.value).toBeNull()
    expect(masse.value).toBeNull()
  })
})
