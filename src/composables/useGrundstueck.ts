import { computed, shallowRef } from 'vue'
import { berechneMasse, type GrundstueckPolygon } from '@/lib/geometrie'

export function useGrundstueck() {
  const grundstueck = shallowRef<GrundstueckPolygon | null>(null)
  const masse = computed(() => (grundstueck.value ? berechneMasse(grundstueck.value) : null))

  function entferneGrundstueck(): void {
    grundstueck.value = null
  }

  return { grundstueck, masse, entferneGrundstueck }
}
