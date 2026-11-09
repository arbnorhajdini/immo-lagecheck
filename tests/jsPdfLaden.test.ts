import { describe, expect, it } from 'vitest'
import { istModulLadefehler, ladeJsPdf, ladeJsPdfImVoraus } from '@/lib/jsPdfLaden'

describe('istModulLadefehler', () => {
  it('erkennt, wenn ein nachgeladenes Modul nach einem neuen Deployment fehlt', () => {
    expect(
      istModulLadefehler(
        new TypeError(
          'Failed to fetch dynamically imported module: https://x/assets/jspdf.es.min-alt.js',
        ),
      ),
    ).toBe(true)
    expect(istModulLadefehler(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(istModulLadefehler(new TypeError('error loading dynamically imported module'))).toBe(
      true,
    )
  })

  it('verwechselt andere Fehler nicht damit', () => {
    expect(istModulLadefehler(new TypeError('Failed to fetch'))).toBe(false)
    expect(istModulLadefehler(new Error('Canvas fehlt'))).toBe(false)
    expect(istModulLadefehler('kaputt')).toBe(false)
  })
})

describe('ladeJsPdf', () => {
  it('lädt jsPDF nur einmal und gibt beim zweiten Mal dasselbe Modul zurück', async () => {
    const erstes = await ladeJsPdf()
    const zweites = await ladeJsPdf()

    expect(zweites).toBe(erstes)
    expect(typeof erstes.jsPDF).toBe('function')
  })

  it('meldet beim Vorladen, ob es geklappt hat', async () => {
    expect(await ladeJsPdfImVoraus()).toBe(true)
  })
})
