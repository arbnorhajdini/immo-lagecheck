import { afterEach, describe, expect, it, vi } from 'vitest'
import { useExposeExport } from '@/composables/useExposeExport'
import type { ExposeAuftrag } from '@/lib/expose'
import { HAUS, quadratAlsBezug } from './testdaten'

const auftrag: ExposeAuftrag = {
  objektart: HAUS,
  adresse: null,
  bezug: quadratAlsBezug,
  masse: { flaecheQm: 12_364, umfangM: 445 },
  auswertung: null,
}

describe('useExposeExport', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('meldet während der Erstellung, dass Karten geladen werden', () => {
    const { status, meldung, laedt, speichereAlsPdf } = useExposeExport(
      () => new Promise<string>(() => {}),
    )

    void speichereAlsPdf(auftrag)

    expect(status.value).toBe('laedt')
    expect(laedt.value).toBe(true)
    expect(meldung.value).toContain('Kartenausschnitte')
  })

  it('nennt den Dateinamen, sobald das PDF gespeichert ist', async () => {
    const speichere = vi.fn().mockResolvedValue('Lage-Steckbrief_Grundstueck_2026-11-09.pdf')
    const { status, meldung, speichereAlsPdf } = useExposeExport(speichere)

    await speichereAlsPdf(auftrag)

    expect(speichere).toHaveBeenCalledWith(auftrag)
    expect(status.value).toBe('gespeichert')
    expect(meldung.value).toBe('PDF gespeichert: Lage-Steckbrief_Grundstueck_2026-11-09.pdf')
  })

  it('bittet um Neuladen, wenn die App inzwischen neu deployt wurde', async () => {
    const veralteterBuild = new TypeError(
      'Failed to fetch dynamically imported module: https://x/assets/jspdf.es.min-alt.js',
    )
    const { status, meldung, istVeraltet, speichereAlsPdf } = useExposeExport(
      vi.fn().mockRejectedValue(veralteterBuild),
    )

    await speichereAlsPdf(auftrag)

    expect(status.value).toBe('veraltet')
    expect(istVeraltet.value).toBe(true)
    expect(meldung.value).toContain('Seite neu laden')
  })

  it('verdächtigt bei anderen Fehlern nicht die Internetverbindung', async () => {
    const { status, meldung, speichereAlsPdf } = useExposeExport(
      vi.fn().mockRejectedValue(new Error('Canvas fehlt')),
    )

    await speichereAlsPdf(auftrag)

    expect(status.value).toBe('fehler')
    expect(meldung.value).toBe('Das PDF konnte nicht erstellt werden. Bitte erneut versuchen.')
  })

  it('protokolliert den eigentlichen Fehler in der Konsole', async () => {
    const fehler = new Error('Canvas fehlt')
    const konsole = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { speichereAlsPdf } = useExposeExport(vi.fn().mockRejectedValue(fehler))

    await speichereAlsPdf(auftrag)

    expect(konsole).toHaveBeenCalledWith('PDF-Export fehlgeschlagen', fehler)
  })
})
