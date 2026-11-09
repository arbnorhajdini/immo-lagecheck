import { describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'
import { useUmgebung } from '@/composables/useUmgebung'
import type { GrundstueckPolygon } from '@/lib/geometrie'
import { OverpassFehler } from '@/lib/overpass'
import { ortAn, quadratAmAequator, STAND_9_NOVEMBER_2026 } from './testdaten'

const supermarktDaneben = ortAn('supermarkt', 'Markt am Eck', { lat: 0.0005, lon: 0.002 })

function geladen(ausZwischenspeicher: boolean) {
  return { orte: [supermarktDaneben], stand: STAND_9_NOVEMBER_2026, ausZwischenspeicher }
}

function richteEin(dienst = vi.fn().mockResolvedValue(geladen(false))) {
  const grundstueck = shallowRef<GrundstueckPolygon | null>(quadratAmAequator)
  const umgebung = useUmgebung(grundstueck, dienst)
  return { grundstueck, umgebung, dienst }
}

describe('useUmgebung', () => {
  it('kann ohne Grundstück nicht prüfen', () => {
    const { grundstueck, umgebung } = richteEin()

    grundstueck.value = null

    expect(umgebung.kannPruefen.value).toBe(false)
  })

  it('fragt einmal mit dem Mittelpunkt des Grundstücks an', async () => {
    const { umgebung, dienst } = richteEin()

    await umgebung.pruefen()

    expect(dienst).toHaveBeenCalledTimes(1)
    const [mittelpunkt] = dienst.mock.calls[0]!
    expect(mittelpunkt.lat).toBeCloseTo(0.0005, 6)
    expect(mittelpunkt.lon).toBeCloseTo(0.0005, 6)
  })

  it('liefert pro Kategorie den nächsten Ort und eine Zusammenfassung', async () => {
    const { umgebung } = richteEin()

    await umgebung.pruefen()

    const supermarkt = umgebung.auswertung.value?.ergebnisse.find(
      ({ kategorie }) => kategorie === 'supermarkt',
    )
    expect(umgebung.status.value).toBe('fertig')
    expect(supermarkt?.naechsterOrt?.ort.name).toBe('Markt am Eck')
    expect(umgebung.statusText.value).toBe(
      '1 von 8 Kategorien im Umkreis von 1,5\u00a0km gefunden.',
    )
  })

  it('nennt das Datum, wenn das Ergebnis aus dem Zwischenspeicher kommt', async () => {
    const { umgebung } = richteEin(vi.fn().mockResolvedValue(geladen(true)))

    await umgebung.pruefen()

    expect(umgebung.statusText.value).toContain('Gespeichertes Ergebnis vom 09.11.2026.')
    expect(umgebung.auswertung.value?.ausZwischenspeicher).toBe(true)
  })

  it('zeigt eine verständliche Meldung, wenn der Dienst überlastet ist', async () => {
    const { umgebung } = richteEin(vi.fn().mockRejectedValue(new OverpassFehler(504)))

    await umgebung.pruefen()

    expect(umgebung.status.value).toBe('fehler')
    expect(umgebung.statusText.value).toContain('antwortet gerade nicht')
  })

  it('verwirft das Ergebnis, sobald sich das Grundstück ändert', async () => {
    const { grundstueck, umgebung } = richteEin()
    await umgebung.pruefen()

    grundstueck.value = { ...quadratAmAequator }
    await nextTick()

    expect(umgebung.auswertung.value).toBeNull()
    expect(umgebung.status.value).toBe('bereit')
  })
})
