import { describe, expect, it } from 'vitest'
import { formatiereFlaeche, formatiereLaenge } from '@/lib/format'

const TRENNER = ' '

describe('formatiereFlaeche', () => {
  it('zeigt kleine Flächen in ganzen Quadratmetern', () => {
    expect(formatiereFlaeche(850.4)).toBe(`850${TRENNER}m²`)
  })

  it('setzt Tausenderpunkte', () => {
    expect(formatiereFlaeche(1234)).toBe(`1.234${TRENNER}m²`)
  })

  it('ergänzt ab 10.000 m² die Fläche in Hektar', () => {
    expect(formatiereFlaeche(12_345)).toBe(`12.345${TRENNER}m² (1,23${TRENNER}ha)`)
  })

  it('zeigt Hektar auch, wenn erst das Runden 10.000 m² ergibt', () => {
    expect(formatiereFlaeche(9_999.6)).toBe(`10.000${TRENNER}m² (1,00${TRENNER}ha)`)
  })
})

describe('formatiereLaenge', () => {
  it('zeigt kurze Strecken in ganzen Metern', () => {
    expect(formatiereLaenge(849.7)).toBe(`850${TRENNER}m`)
  })

  it('wechselt ab 1.000 m auf Kilometer mit einer Nachkommastelle', () => {
    expect(formatiereLaenge(1_234)).toBe(`1,2${TRENNER}km`)
  })

  it('schreibt 999,6 m nicht als „1.000 m“, sondern als Kilometer', () => {
    expect(formatiereLaenge(999.6)).toBe(`1,0${TRENNER}km`)
  })

  it('zeigt 0 m für Punkte innerhalb des Grundstücks', () => {
    expect(formatiereLaenge(0)).toBe(`0${TRENNER}m`)
  })
})
