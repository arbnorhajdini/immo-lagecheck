import { describe, expect, it } from 'vitest'
import { alsPdfText } from '@/lib/pdfText'

describe('alsPdfText', () => {
  it('lässt deutsche Umlaute und typische Sonderzeichen unverändert', () => {
    const text = 'Größe: 1.234\u00a0m² – Straße „Am Bötzel“ · 52,4° N · € 5'

    expect(alsPdfText(text)).toBe(text)
  })

  it('ersetzt Buchstaben mit Akzent außerhalb von WinAnsi durch den Grundbuchstaben', () => {
    expect(alsPdfText('Şahin Döner')).toBe('Sahin Döner')
    expect(alsPdfText('Dvořák')).toBe('Dvorák')
  })

  it('setzt ein Fragezeichen für Zeichen ohne lateinische Entsprechung', () => {
    expect(alsPdfText('Kita 🧸')).toBe('Kita ?')
    expect(alsPdfText('Łódź')).toBe('?ódz')
  })
})
