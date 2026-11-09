import { describe, expect, it } from 'vitest'
import { ermittleTheme, istThemeModus } from '@/composables/useTheme'

describe('ermittleTheme', () => {
  it('folgt im Modus „system“ der Systemeinstellung', () => {
    expect(ermittleTheme('system', true)).toBe('dark')
    expect(ermittleTheme('system', false)).toBe('light')
  })

  it('ignoriert die Systemeinstellung bei fester Auswahl', () => {
    expect(ermittleTheme('light', true)).toBe('light')
    expect(ermittleTheme('dark', false)).toBe('dark')
  })
})

describe('istThemeModus', () => {
  it('erkennt gültige und ungültige Werte', () => {
    expect(istThemeModus('dark')).toBe(true)
    expect(istThemeModus('system')).toBe(true)
    expect(istThemeModus('blau')).toBe(false)
    expect(istThemeModus(null)).toBe(false)
  })
})
