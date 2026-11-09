import { describe, expect, it } from 'vitest'
import { erstelleExposeInhalt, type ExposeDaten } from '@/lib/exposeInhalt'
import { ermittleNaechsteOrte } from '@/lib/umgebung'
import type { AdressTreffer, UmgebungsAuswertung } from '@/types'
import { ortAn, quadratAmAequator, STAND_9_NOVEMBER_2026, strasseEntlang } from './testdaten'

const TRENNER = '\u00a0'

const ellenriederstrasse: AdressTreffer = {
  id: 1,
  kurzName: 'Ellenriederstraße 64, 38446 Wolfsburg',
  vollName: '64, Ellenriederstraße, Reislingen, Wolfsburg',
  lat: 52.41414,
  lon: 10.83708,
  begrenzung: null,
}

const auswertung: UmgebungsAuswertung = {
  mittelpunkt: { lat: 0.0005, lon: 0.0005 },
  umkreisM: 1500,
  stand: STAND_9_NOVEMBER_2026,
  ausZwischenspeicher: false,
  ergebnisse: ermittleNaechsteOrte(quadratAmAequator, [
    ortAn('supermarkt', 'Edeka', { lat: 0.0005, lon: 0.004 }),
    ortAn('kita', 'St. Markus', { lat: 0.0005, lon: 0.002 }),
    ortAn('apotheke', 'Reislinger Apotheke', { lat: 0.0005, lon: 0.003 }),
    ortAn('schule', 'Käferschule', { lat: 0.0005, lon: 0.006 }),
    strasseEntlang('L 290', [
      { lat: -0.001, lon: 0.005 },
      { lat: 0.002, lon: 0.005 },
    ]),
  ]),
}

function inhaltMit(ueberschreibungen: Partial<ExposeDaten> = {}) {
  return erstelleExposeInhalt({
    adresse: ellenriederstrasse,
    masse: { flaecheQm: 499.4, umfangM: 86.2 },
    mittelpunkt: { lat: 52.41414, lon: 10.83708 },
    auswertung,
    erstelltAm: STAND_9_NOVEMBER_2026,
    ...ueberschreibungen,
  })
}

describe('erstelleExposeInhalt', () => {
  it('teilt die Adresse in Straße als Titel und Ort als Untertitel', () => {
    const { titel, untertitel, erstelltAm } = inhaltMit()

    expect(titel).toBe('Ellenriederstraße 64')
    expect(untertitel).toBe('38446 Wolfsburg')
    expect(erstelltAm).toBe('Erstellt am 09.11.2026')
  })

  it('nennt ohne Adresse die Koordinaten des Grundstücks', () => {
    const { titel, untertitel } = inhaltMit({ adresse: null })

    expect(titel).toBe('Grundstück')
    expect(untertitel).toBe('52,4141° N, 10,8371° O')
  })

  it('zeigt Fläche, Umfang und Infrastruktur als Kennzahlen', () => {
    const [flaeche, umfang, infrastruktur] = inhaltMit().kennzahlen

    expect(flaeche).toEqual({
      bezeichnung: 'Grundstücksfläche',
      wert: `499${TRENNER}m²`,
      zusatz: 'eingezeichnet',
    })
    expect(umfang?.wert).toBe(`86${TRENNER}m`)
    expect(infrastruktur?.wert).toBe('5 von 8')
  })

  it('ergänzt ab einem Hektar die Fläche in Hektar', () => {
    const [flaeche] = inhaltMit({ masse: { flaecheQm: 12_345, umfangM: 450 } }).kennzahlen

    expect(flaeche?.zusatz).toBe(`1,23${TRENNER}ha`)
  })

  it('zeigt die vier nächstgelegenen Ziele, sortiert nach Entfernung', () => {
    const ziele = inhaltMit().naechsteZiele.map(({ bezeichnung }) => bezeichnung)

    expect(ziele).toEqual(['Kita', 'Apotheke', 'Supermarkt', 'Hauptstraße'])
  })

  it('nummeriert in der Umgebungstabelle nur gefundene Orte, in fester Reihenfolge', () => {
    const zeilen = inhaltMit().umgebung?.zeilen ?? []

    expect(zeilen.map(({ kategorie, nummer }) => [kategorie, nummer])).toEqual([
      ['Bushaltestelle', null],
      ['Bahnhof/Haltepunkt', null],
      ['Supermarkt', 1],
      ['Schule', 2],
      ['Kita', 3],
      ['Apotheke', 4],
      ['Arztpraxis', null],
      ['Hauptstraße', 5],
    ])
    expect(zeilen[0]?.name).toBe(`nicht im Umkreis von 1,5${TRENNER}km`)
  })

  it('lässt Umgebung und nächste Ziele weg, wenn noch nicht geprüft wurde', () => {
    const inhalt = inhaltMit({ auswertung: null })

    expect(inhalt.umgebung).toBeNull()
    expect(inhalt.naechsteZiele).toEqual([])
    expect(inhalt.kennzahlen[2]?.zusatz).toBe('noch nicht geprüft')
  })

  it('erzeugt einen lesbaren Dateinamen ohne Umlaute und Leerzeichen', () => {
    expect(inhaltMit().dateiname).toBe(
      'Lage-Steckbrief_Ellenriederstrasse-64_38446-Wolfsburg_2026-11-09.pdf',
    )
    expect(inhaltMit({ adresse: null }).dateiname).toBe(
      'Lage-Steckbrief_Grundstueck_2026-11-09.pdf',
    )
  })
})
