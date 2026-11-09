import { describe, expect, it } from 'vitest'
import {
  abstandZumGrundstueckM,
  berechneFlaecheQm,
  berechneMasse,
  berechneMittelpunkt,
  berechneUmfangM,
  type GrundstueckPolygon,
} from '@/lib/geometrie'
import {
  FLAECHE_QUADRAT_QM,
  grundstueckAus,
  METER_PRO_TAUSENDSTEL_GRAD,
  quadratAmAequator,
  UMFANG_QUADRAT_M,
} from './testdaten'
import type { Ortsgeometrie } from '@/types'

describe('berechneFlaecheQm', () => {
  it('berechnet die Fläche eines Quadrats mit rund 111 m Kantenlänge', () => {
    expect(berechneFlaecheQm(quadratAmAequator)).toBeCloseTo(FLAECHE_QUADRAT_QM, 0)
  })

  it('liefert für ein Dreieck die halbe Fläche des Quadrats', () => {
    const halbesQuadrat = grundstueckAus([
      [0, 0],
      [0.001, 0],
      [0.001, 0.001],
    ])

    expect(berechneFlaecheQm(halbesQuadrat)).toBeCloseTo(FLAECHE_QUADRAT_QM / 2, 0)
  })
})

describe('berechneUmfangM', () => {
  it('summiert alle vier Kanten des Quadrats', () => {
    expect(berechneUmfangM(quadratAmAequator)).toBeCloseTo(UMFANG_QUADRAT_M, 1)
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

    expect(masse.flaecheQm).toBeCloseTo(FLAECHE_QUADRAT_QM, 0)
    expect(masse.umfangM).toBeCloseTo(UMFANG_QUADRAT_M, 1)
  })
})

describe('berechneMittelpunkt', () => {
  it('liegt in der Mitte des Quadrats', () => {
    const { lat, lon } = berechneMittelpunkt(quadratAmAequator)

    expect(lat).toBeCloseTo(0.0005, 6)
    expect(lon).toBeCloseTo(0.0005, 6)
  })
})

describe('abstandZumGrundstueckM', () => {
  it('ist 0 für einen Ort innerhalb des Grundstücks', () => {
    const imGrundstueck: Ortsgeometrie = { art: 'punkt', position: { lat: 0.0005, lon: 0.0005 } }

    expect(abstandZumGrundstueckM(quadratAmAequator, imGrundstueck)).toBe(0)
  })

  it('misst die Luftlinie vom Grundstücksrand, nicht vom Mittelpunkt', () => {
    const oestlichDaneben: Ortsgeometrie = { art: 'punkt', position: { lat: 0.0005, lon: 0.002 } }

    expect(abstandZumGrundstueckM(quadratAmAequator, oestlichDaneben)).toBeCloseTo(
      METER_PRO_TAUSENDSTEL_GRAD,
      1,
    )
  })

  it('ist 0 für eine Straße, die das Grundstück kreuzt', () => {
    const quer: Ortsgeometrie = {
      art: 'linie',
      verlauf: [
        { lat: 0.0005, lon: -0.001 },
        { lat: 0.0005, lon: 0.002 },
      ],
    }

    expect(abstandZumGrundstueckM(quadratAmAequator, quer)).toBe(0)
  })

  it('misst bei einer Straße den kürzesten Abstand zur Linie', () => {
    const parallel: Ortsgeometrie = {
      art: 'linie',
      verlauf: [
        { lat: -0.001, lon: 0.003 },
        { lat: 0.002, lon: 0.003 },
      ],
    }

    expect(abstandZumGrundstueckM(quadratAmAequator, parallel)).toBeCloseTo(
      2 * METER_PRO_TAUSENDSTEL_GRAD,
      1,
    )
  })
})
