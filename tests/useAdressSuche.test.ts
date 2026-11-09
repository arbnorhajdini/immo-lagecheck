import { describe, expect, it, vi } from 'vitest'
import { statusTextFuer, useAdressSuche } from '@/composables/useAdressSuche'
import { NominatimFehler } from '@/lib/nominatim'
import type { AdressTreffer } from '@/types'

const marienplatz: AdressTreffer = {
  id: 1,
  kurzName: 'Marienplatz 1, 80331 München',
  vollName: 'Marienplatz 1, München',
  lat: 48.1375,
  lon: 11.5748,
  begrenzung: null,
}

describe('useAdressSuche', () => {
  it('fragt bei zu kurzem Suchbegriff nicht beim Dienst an', async () => {
    const dienst = vi.fn()
    const suche = useAdressSuche(dienst)
    suche.suchbegriff.value = 'ab'

    await suche.suchen()

    expect(dienst).not.toHaveBeenCalled()
    expect(suche.status.value).toBe('fehler')
    expect(suche.statusText.value).toContain('mindestens 3 Zeichen')
  })

  it('liefert Treffer für den bereinigten Suchbegriff', async () => {
    const dienst = vi.fn().mockResolvedValue([marienplatz])
    const suche = useAdressSuche(dienst)
    suche.suchbegriff.value = '  Marienplatz 1  '

    const treffer = await suche.suchen()

    expect(dienst).toHaveBeenCalledWith('Marienplatz 1', expect.any(AbortSignal))
    expect(treffer).toEqual([marienplatz])
    expect(suche.status.value).toBe('gefunden')
    expect(suche.statusText.value).toBe('1 Adresse gefunden.')
  })

  it('meldet, wenn nichts gefunden wurde', async () => {
    const suche = useAdressSuche(vi.fn().mockResolvedValue([]))
    suche.suchbegriff.value = 'Gibtesnichtstraße 999'

    await suche.suchen()

    expect(suche.status.value).toBe('nichtsGefunden')
    expect(suche.statusText.value).toContain('Keine Adresse gefunden')
  })

  it('zeigt bei zu vielen Anfragen eine verständliche Meldung', async () => {
    const suche = useAdressSuche(vi.fn().mockRejectedValue(new NominatimFehler(429)))
    suche.suchbegriff.value = 'Marienplatz 1'

    await suche.suchen()

    expect(suche.status.value).toBe('fehler')
    expect(suche.statusText.value).toContain('Zu viele Anfragen')
  })

  it('verwirft das Ergebnis einer überholten Suche', async () => {
    let beantworteErsteSuche: (treffer: AdressTreffer[]) => void = () => {}
    const dienst = vi
      .fn()
      .mockImplementationOnce(() => new Promise((antworte) => (beantworteErsteSuche = antworte)))
      .mockResolvedValueOnce([])
    const suche = useAdressSuche(dienst)

    suche.suchbegriff.value = 'Erste Suche'
    const ersteSuche = suche.suchen()
    suche.suchbegriff.value = 'Zweite Suche'
    await suche.suchen()
    beantworteErsteSuche([marienplatz])

    expect(await ersteSuche).toEqual([])
    expect(suche.status.value).toBe('nichtsGefunden')
    expect(suche.treffer.value).toEqual([])
  })
})

describe('statusTextFuer', () => {
  it('fordert bei mehreren Treffern zur Auswahl auf', () => {
    expect(statusTextFuer('gefunden', 3, '')).toBe(
      '3 Adressen gefunden. Bitte die passende auswählen.',
    )
  })

  it('ist im Ausgangszustand leer', () => {
    expect(statusTextFuer('bereit', 0, '')).toBe('')
  })
})
