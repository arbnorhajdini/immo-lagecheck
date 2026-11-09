import { describe, expect, it, vi } from 'vitest'
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

  it('zeigt eine verständliche Meldung, wenn Karten nicht geladen werden können', async () => {
    const { status, meldung, speichereAlsPdf } = useExposeExport(
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    )

    await speichereAlsPdf(auftrag)

    expect(status.value).toBe('fehler')
    expect(meldung.value).toContain('Internetverbindung')
  })
})
