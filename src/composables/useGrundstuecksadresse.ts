import { computed, type Ref, shallowRef, watch } from 'vue'
import { berechneMittelpunkt, type GrundstueckPolygon } from '@/lib/geometrie'
import {
  type Adressabgleich,
  abstandAdresseZumGrundstueckM,
  adresshinweis,
  passtAdresseZumGrundstueck,
  wirksameAdresse,
} from '@/lib/grundstuecksadresse'
import { sucheAdresseZuKoordinate } from '@/lib/nominatim'
import type { AdressTreffer } from '@/types'

export function useGrundstuecksadresse(
  gesuchteAdresse: Readonly<Ref<AdressTreffer | null>>,
  grundstueck: Readonly<Ref<GrundstueckPolygon | null>>,
  ermittleAdresse = sucheAdresseZuKoordinate,
) {
  const abgleich = shallowRef<Adressabgleich>({ status: 'ohneGrundstueck' })
  let laufendeAnfrage: AbortController | null = null

  function ersetzeLaufendeAnfrage(): AbortSignal {
    laufendeAnfrage?.abort()
    laufendeAnfrage = new AbortController()
    return laufendeAnfrage.signal
  }

  async function ermittleAdresseAmGrundstueck(
    flaeche: GrundstueckPolygon,
    abstandM: number | null,
  ): Promise<void> {
    const signal = ersetzeLaufendeAnfrage()
    abgleich.value = { status: 'laedt', abstandM }
    try {
      const adresse = await ermittleAdresse(berechneMittelpunkt(flaeche), signal)
      if (signal.aborted) return
      abgleich.value = adresse
        ? { status: 'ermittelt', abstandM, adresse }
        : { status: 'fehler', abstandM }
    } catch {
      if (!signal.aborted) abgleich.value = { status: 'fehler', abstandM }
    }
  }

  async function gleicheAb(): Promise<void> {
    laufendeAnfrage?.abort()
    const flaeche = grundstueck.value
    if (!flaeche) {
      abgleich.value = { status: 'ohneGrundstueck' }
      return
    }

    const gesucht = gesuchteAdresse.value
    const abstandM = gesucht ? abstandAdresseZumGrundstueckM(gesucht, flaeche) : null
    if (abstandM !== null && passtAdresseZumGrundstueck(abstandM)) {
      abgleich.value = { status: 'passt' }
      return
    }
    await ermittleAdresseAmGrundstueck(flaeche, abstandM)
  }

  watch([gesuchteAdresse, grundstueck], gleicheAb, { immediate: true })

  return {
    abgleich,
    wirksameAdresse: computed(() => wirksameAdresse(gesuchteAdresse.value, abgleich.value)),
    hinweis: computed(() => adresshinweis(abgleich.value)),
  }
}
