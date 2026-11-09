import { describe, expect, it } from 'vitest'
import {
  bezugsobjektFuer,
  fehlenderSchrittText,
  luftlinieAb,
  OBJEKTARTEN,
  schrittnummern,
} from '@/lib/objektart'
import type { AdressTreffer } from '@/types'
import { HAUS, quadratAmAequator, UNBEBAUTES_GRUNDSTUECK, WOHNUNG } from './testdaten'

const adresse: AdressTreffer = {
  id: 1,
  kurzName: 'Ellenriederstraße 64, 38446 Wolfsburg',
  vollName: '64, Ellenriederstraße, Wolfsburg',
  lat: 52.41414,
  lon: 10.83708,
  begrenzung: null,
}

describe('Objektarten', () => {
  it('bietet Haus, Wohnung und unbebautes Grundstück an', () => {
    expect(OBJEKTARTEN.map(({ bezeichnung }) => bezeichnung)).toEqual([
      'Haus mit Grundstück',
      'Wohnung',
      'Grundstück (unbebaut)',
    ])
  })

  it('misst bei Grundstücken ab der Grenze, bei Wohnungen ab der Adresse', () => {
    expect(luftlinieAb(HAUS)).toBe('Grundstücksgrenze')
    expect(luftlinieAb(UNBEBAUTES_GRUNDSTUECK)).toBe('Grundstücksgrenze')
    expect(luftlinieAb(WOHNUNG)).toBe('Adresse')
  })
})

describe('schrittnummern', () => {
  it('nummeriert mit Grundstück vier Schritte', () => {
    expect(schrittnummern(HAUS)).toEqual({ adresse: 1, grundstueck: 2, umgebung: 3, steckbrief: 4 })
  })

  it('lässt bei einer Wohnung den Grundstücksschritt weg', () => {
    expect(schrittnummern(WOHNUNG)).toEqual({
      adresse: 1,
      grundstueck: null,
      umgebung: 2,
      steckbrief: 3,
    })
  })
})

describe('bezugsobjektFuer', () => {
  it('nimmt bei einem Haus das gezeichnete Grundstück, nicht die Adresse', () => {
    expect(bezugsobjektFuer(HAUS, adresse, quadratAmAequator)).toEqual({
      art: 'grundstueck',
      grundstueck: quadratAmAequator,
    })
    expect(bezugsobjektFuer(HAUS, adresse, null)).toBeNull()
  })

  it('nimmt bei einer Wohnung den Adresspunkt, ein Grundstück ist nicht nötig', () => {
    expect(bezugsobjektFuer(WOHNUNG, adresse, null)).toEqual({
      art: 'adresse',
      position: { lat: 52.41414, lon: 10.83708 },
    })
    expect(bezugsobjektFuer(WOHNUNG, null, null)).toBeNull()
  })

  it('nennt den jeweils fehlenden Schritt', () => {
    expect(fehlenderSchrittText(HAUS)).toBe('Zuerst ein Grundstück einzeichnen.')
    expect(fehlenderSchrittText(WOHNUNG)).toBe('Zuerst eine Adresse suchen.')
  })
})
