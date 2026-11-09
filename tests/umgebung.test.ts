import { describe, expect, it } from 'vitest'
import { ermittleNaechsteOrte } from '@/lib/umgebung'
import { UMGEBUNGS_KATEGORIEN } from '@/lib/umgebungKategorien'
import { ortAn, quadratAmAequator, strasseEntlang } from './testdaten'

describe('ermittleNaechsteOrte', () => {
  it('liefert für jede Kategorie genau ein Ergebnis in fester Reihenfolge', () => {
    const ergebnisse = ermittleNaechsteOrte(quadratAmAequator, [])

    expect(ergebnisse.map(({ kategorie }) => kategorie)).toEqual(
      UMGEBUNGS_KATEGORIEN.map(({ schluessel }) => schluessel),
    )
  })

  it('wählt pro Kategorie den Ort mit dem kürzesten Abstand zum Grundstücksrand', () => {
    const orte = [
      ortAn('supermarkt', 'Weit weg', { lat: 0.0005, lon: 0.005 }),
      ortAn('supermarkt', 'Nah dran', { lat: 0.0005, lon: 0.002 }),
      ortAn('schule', 'Grundschule', { lat: 0.003, lon: 0.0005 }),
    ]

    const ergebnisse = ermittleNaechsteOrte(quadratAmAequator, orte)
    const supermarkt = ergebnisse.find(({ kategorie }) => kategorie === 'supermarkt')
    const schule = ergebnisse.find(({ kategorie }) => kategorie === 'schule')

    expect(supermarkt?.naechsterOrt?.ort.name).toBe('Nah dran')
    expect(supermarkt?.naechsterOrt?.abstandM).toBeCloseTo(111.2, 0)
    expect(schule?.naechsterOrt?.ort.name).toBe('Grundschule')
  })

  it('meldet Kategorien ohne Treffer mit null', () => {
    const ergebnisse = ermittleNaechsteOrte(quadratAmAequator, [
      ortAn('apotheke', 'Löwen-Apotheke', { lat: 0, lon: 0.002 }),
    ])
    const kita = ergebnisse.find(({ kategorie }) => kategorie === 'kita')

    expect(kita?.naechsterOrt).toBeNull()
  })

  it('misst bei der Hauptstraße den Abstand zur Linie', () => {
    const ergebnisse = ermittleNaechsteOrte(quadratAmAequator, [
      strasseEntlang('B 188', [
        { lat: -0.001, lon: 0.003 },
        { lat: 0.002, lon: 0.003 },
      ]),
    ])
    const hauptstrasse = ergebnisse.find(({ kategorie }) => kategorie === 'hauptstrasse')

    expect(hauptstrasse?.naechsterOrt?.ort.name).toBe('B 188')
    expect(hauptstrasse?.naechsterOrt?.abstandM).toBeCloseTo(222.4, 0)
  })
})
