import { describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'
import { useGrundstuecksadresse } from '@/composables/useGrundstuecksadresse'
import type { GrundstueckPolygon } from '@/lib/geometrie'
import type { AdressTreffer } from '@/types'
import { quadratAmAequator } from './testdaten'

function adresseBei(lon: number, kurzName: string): AdressTreffer {
  return { id: lon, kurzName, vollName: kurzName, lat: 0.0005, lon, begrenzung: null }
}

const amGrundstueck = adresseBei(0.0013, 'Musterweg 5, 12345 Ort')
const weitWeg = adresseBei(0.01, 'Fernstraße 99, 12345 Ort')
const ermittelt = adresseBei(0.0005, 'Gartenweg 7, 12345 Ort')

async function warteAufAbgleich(): Promise<void> {
  await nextTick()
  await new Promise((weiter) => setTimeout(weiter, 0))
}

function richteEin(gesucht: AdressTreffer | null, ermittle = vi.fn().mockResolvedValue(ermittelt)) {
  const adresse = shallowRef<AdressTreffer | null>(gesucht)
  const grundstueck = shallowRef<GrundstueckPolygon | null>(quadratAmAequator)
  return {
    adresse,
    grundstueck,
    ermittle,
    ...useGrundstuecksadresse(adresse, grundstueck, ermittle),
  }
}

describe('useGrundstuecksadresse', () => {
  it('behält die gesuchte Adresse, wenn sie am Grundstück liegt, ohne Nominatim zu fragen', async () => {
    const { wirksameAdresse, hinweis, ermittle } = richteEin(amGrundstueck)
    await warteAufAbgleich()

    expect(wirksameAdresse.value).toBe(amGrundstueck)
    expect(hinweis.value).toBe('')
    expect(ermittle).not.toHaveBeenCalled()
  })

  it('ermittelt die Adresse am Grundstück, wenn woanders gezeichnet wurde', async () => {
    const { wirksameAdresse, hinweis, ermittle } = richteEin(weitWeg)
    await warteAufAbgleich()

    const [mittelpunkt] = ermittle.mock.calls[0]!
    expect(mittelpunkt.lat).toBeCloseTo(0.0005, 6)
    expect(wirksameAdresse.value).toBe(ermittelt)
    expect(hinweis.value).toContain('von der gesuchten Adresse entfernt')
  })

  it('ermittelt auch eine Adresse, wenn gar keine gesucht wurde', async () => {
    const { wirksameAdresse } = richteEin(null)
    await warteAufAbgleich()

    expect(wirksameAdresse.value).toBe(ermittelt)
  })

  it('nennt keine falsche Adresse, wenn Nominatim nichts findet', async () => {
    const { wirksameAdresse, hinweis } = richteEin(weitWeg, vi.fn().mockResolvedValue(null))
    await warteAufAbgleich()

    expect(wirksameAdresse.value).toBeNull()
    expect(hinweis.value).toContain('Koordinaten')
  })

  it('gleicht neu ab, wenn das Grundstück entfernt wird', async () => {
    const { wirksameAdresse, grundstueck, hinweis } = richteEin(weitWeg)
    await warteAufAbgleich()

    grundstueck.value = null
    await warteAufAbgleich()

    expect(wirksameAdresse.value).toBe(weitWeg)
    expect(hinweis.value).toBe('')
  })
})
