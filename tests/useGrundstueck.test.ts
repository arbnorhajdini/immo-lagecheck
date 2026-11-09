import { describe, expect, it } from 'vitest'
import { useGrundstueck } from '@/composables/useGrundstueck'
import { FLAECHE_QUADRAT_QM, quadratAmAequator, UMFANG_QUADRAT_M } from './testdaten'

describe('useGrundstueck', () => {
  it('hat ohne Grundstück keine Maße', () => {
    const { masse } = useGrundstueck()

    expect(masse.value).toBeNull()
  })

  it('berechnet die Maße, sobald ein Grundstück gezeichnet ist', () => {
    const { grundstueck, masse } = useGrundstueck()

    grundstueck.value = quadratAmAequator

    expect(masse.value?.flaecheQm).toBeCloseTo(FLAECHE_QUADRAT_QM, 0)
    expect(masse.value?.umfangM).toBeCloseTo(UMFANG_QUADRAT_M, 1)
  })

  it('verwirft die Maße, wenn das Grundstück entfernt wird', () => {
    const { grundstueck, masse, entferneGrundstueck } = useGrundstueck()
    grundstueck.value = quadratAmAequator

    entferneGrundstueck()

    expect(grundstueck.value).toBeNull()
    expect(masse.value).toBeNull()
  })
})
