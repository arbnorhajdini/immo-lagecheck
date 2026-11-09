import { describe, expect, it } from 'vitest'
import {
  abstandAdresseZumGrundstueckM,
  adresshinweis,
  passtAdresseZumGrundstueck,
  wirksameAdresse,
} from '@/lib/grundstuecksadresse'
import type { AdressTreffer } from '@/types'
import { quadratAmAequator } from './testdaten'

function adresseBei(lon: number, kurzName = 'Gesuchte Straße 1, 12345 Ort'): AdressTreffer {
  return { id: 1, kurzName, vollName: kurzName, lat: 0.0005, lon, begrenzung: null }
}

const amGrundstueck = adresseBei(0.0013, 'Musterweg 5, 12345 Ort')
const weitWeg = adresseBei(0.01)
const ermittelt = adresseBei(0.0005, 'Gartenweg 7, 12345 Ort')

describe('abstandAdresseZumGrundstueckM', () => {
  it('ist 0, wenn die Adresse im Grundstück liegt', () => {
    expect(abstandAdresseZumGrundstueckM(adresseBei(0.0005), quadratAmAequator)).toBe(0)
  })

  it('misst ab der Grundstücksgrenze', () => {
    expect(abstandAdresseZumGrundstueckM(amGrundstueck, quadratAmAequator)).toBeCloseTo(33.4, 0)
  })
})

describe('passtAdresseZumGrundstueck', () => {
  it('akzeptiert Adresspunkte bis 50 m neben der Grenze, etwa auf der Straße davor', () => {
    expect(passtAdresseZumGrundstueck(33)).toBe(true)
    expect(passtAdresseZumGrundstueck(50)).toBe(true)
  })

  it('lehnt weiter entfernte Adressen ab', () => {
    expect(passtAdresseZumGrundstueck(56)).toBe(false)
  })
})

describe('wirksameAdresse', () => {
  it('nimmt die gesuchte Adresse, wenn sie zum Grundstück passt oder keins gezeichnet ist', () => {
    expect(wirksameAdresse(amGrundstueck, { status: 'passt' })).toBe(amGrundstueck)
    expect(wirksameAdresse(weitWeg, { status: 'ohneGrundstueck' })).toBe(weitWeg)
  })

  it('nimmt die am Grundstück ermittelte Adresse, wenn die gesuchte woanders liegt', () => {
    const abgleich = { status: 'ermittelt', abstandM: 950, adresse: ermittelt } as const

    expect(wirksameAdresse(weitWeg, abgleich)).toBe(ermittelt)
  })

  it('nennt keine Adresse, solange sie ermittelt wird oder nicht gefunden wurde', () => {
    expect(wirksameAdresse(weitWeg, { status: 'laedt', abstandM: 950 })).toBeNull()
    expect(wirksameAdresse(weitWeg, { status: 'fehler', abstandM: 950 })).toBeNull()
  })
})

describe('adresshinweis', () => {
  it('schweigt, wenn alles passt', () => {
    expect(adresshinweis({ status: 'passt' })).toBe('')
  })

  it('erklärt Abstand und verwendete Adresse', () => {
    const hinweis = adresshinweis({ status: 'ermittelt', abstandM: 950, adresse: ermittelt })

    expect(hinweis).toBe(
      'Das Grundstück liegt 950\u00a0m von der gesuchten Adresse entfernt. ' +
        'Steckbrief und PDF verwenden die Adresse am Grundstück: Gartenweg 7, 12345 Ort.',
    )
  })

  it('nennt ohne gesuchte Adresse nur die ermittelte', () => {
    const hinweis = adresshinweis({ status: 'ermittelt', abstandM: null, adresse: ermittelt })

    expect(hinweis).toBe(
      'Steckbrief und PDF verwenden die Adresse am Grundstück: Gartenweg 7, 12345 Ort.',
    )
  })

  it('kündigt die Koordinaten an, wenn keine Adresse gefunden wurde', () => {
    expect(adresshinweis({ status: 'fehler', abstandM: null })).toContain(
      'nennen deshalb die Koordinaten',
    )
  })
})
