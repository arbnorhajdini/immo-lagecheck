import { describe, expect, it } from 'vitest'
import { erstelleSteckbrief } from '@/lib/steckbrief'
import { ermittleNaechsteOrte } from '@/lib/umgebung'
import type { AdressTreffer, UmgebungsAuswertung } from '@/types'
import { ortAn, quadratAmAequator, strasseEntlang } from './testdaten'

const TRENNER = ' '

const ellenriederstrasse: AdressTreffer = {
  id: 1,
  kurzName: 'Ellenriederstraße 64, 38446 Wolfsburg',
  vollName: '64, Ellenriederstraße, Reislingen, Wolfsburg',
  lat: 52.41414,
  lon: 10.83708,
  begrenzung: null,
}

const masse = { flaecheQm: 731.4, umfangM: 108.2 }

function auswertungMit(orte: Parameters<typeof ermittleNaechsteOrte>[1]): UmgebungsAuswertung {
  return {
    mittelpunkt: { lat: 0.0005, lon: 0.0005 },
    umkreisM: 1500,
    ergebnisse: ermittleNaechsteOrte(quadratAmAequator, orte),
  }
}

describe('erstelleSteckbrief', () => {
  it('beginnt mit Titel, Adresse, Fläche und Umfang', () => {
    const zeilen = erstelleSteckbrief({ adresse: ellenriederstrasse, masse, auswertung: null })
      .split('\n')
      .slice(0, 4)

    expect(zeilen).toEqual([
      'Lage-Steckbrief',
      'Adresse: Ellenriederstraße 64, 38446 Wolfsburg',
      `Grundstücksfläche: 731${TRENNER}m²`,
      `Umfang: 108${TRENNER}m`,
    ])
  })

  it('lässt die Adresszeile weg, wenn keine Adresse gesucht wurde', () => {
    const steckbrief = erstelleSteckbrief({ adresse: null, masse, auswertung: null })

    expect(steckbrief).not.toContain('Adresse:')
  })

  it('weist darauf hin, wenn die Umgebung noch nicht geprüft wurde', () => {
    const steckbrief = erstelleSteckbrief({ adresse: null, masse, auswertung: null })

    expect(steckbrief).toContain('Umgebung: noch nicht geprüft')
  })

  it('listet jede Kategorie mit Name und Entfernung oder als nicht im Umkreis', () => {
    const auswertung = auswertungMit([
      ortAn('supermarkt', 'Edeka', { lat: 0.0005, lon: 0.002 }),
      strasseEntlang('L 290', [
        { lat: -0.001, lon: 0.003 },
        { lat: 0.002, lon: 0.003 },
      ]),
    ])

    const steckbrief = erstelleSteckbrief({ adresse: null, masse, auswertung })

    expect(steckbrief).toContain(
      `Umgebung (Luftlinie ab Grundstücksgrenze, Umkreis 1,5${TRENNER}km):`,
    )
    expect(steckbrief).toContain(`- Supermarkt: Edeka, 111${TRENNER}m`)
    expect(steckbrief).toContain(`- Hauptstraße: L 290, 222${TRENNER}m`)
    expect(steckbrief).toContain(`- Bahnhof/Haltepunkt: nicht im Umkreis von 1,5${TRENNER}km`)
  })

  it('endet mit der OpenStreetMap-Quellenangabe', () => {
    const steckbrief = erstelleSteckbrief({ adresse: null, masse, auswertung: null })

    expect(steckbrief.split('\n').at(-1)).toBe('Datenquelle: © OpenStreetMap-Mitwirkende (ODbL)')
  })
})
