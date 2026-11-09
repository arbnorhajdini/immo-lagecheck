import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GUELTIGKEIT_MS,
  ladeUmgebungMitZwischenspeicher,
  leseGespeicherteUmgebung,
  ortsschluessel,
  speichereUmgebung,
} from '@/lib/umgebungsZwischenspeicher'
import { ortAn, STAND_9_NOVEMBER_2026 } from './testdaten'

const WOLFSBURG = { lat: 52.41414, lon: 10.83708 }
const LEICHT_VERSCHOBEN = { lat: 52.41431, lon: 10.83742 }
const ANDERER_ORT = { lat: 52.42, lon: 10.78 }
const EDEKA = ortAn('supermarkt', 'Edeka', { lat: 52.415, lon: 10.838 })
const EINE_STUNDE_MS = 60 * 60 * 1000

describe('Zwischenspeicher für Umgebungsdaten', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('findet gespeicherte Orte für denselben Mittelpunkt wieder', () => {
    speichereUmgebung(WOLFSBURG, [EDEKA], STAND_9_NOVEMBER_2026)

    expect(leseGespeicherteUmgebung(WOLFSBURG, STAND_9_NOVEMBER_2026)).toEqual({
      stand: STAND_9_NOVEMBER_2026,
      orte: [EDEKA],
    })
  })

  it('trifft auch ein leicht verschoben gezeichnetes Grundstück', () => {
    speichereUmgebung(WOLFSBURG, [EDEKA], STAND_9_NOVEMBER_2026)

    expect(ortsschluessel(LEICHT_VERSCHOBEN)).toBe(ortsschluessel(WOLFSBURG))
    expect(leseGespeicherteUmgebung(LEICHT_VERSCHOBEN, STAND_9_NOVEMBER_2026)).not.toBeNull()
  })

  it('liefert für einen anderen Ort nichts', () => {
    speichereUmgebung(WOLFSBURG, [EDEKA], STAND_9_NOVEMBER_2026)

    expect(leseGespeicherteUmgebung(ANDERER_ORT, STAND_9_NOVEMBER_2026)).toBeNull()
  })

  it('verwirft Einträge, die älter als 7 Tage sind', () => {
    speichereUmgebung(WOLFSBURG, [EDEKA], STAND_9_NOVEMBER_2026)
    const achtTageSpaeter = STAND_9_NOVEMBER_2026 + GUELTIGKEIT_MS + EINE_STUNDE_MS

    expect(leseGespeicherteUmgebung(WOLFSBURG, achtTageSpaeter)).toBeNull()
  })

  it('räumt abgelaufene Einträge beim nächsten Speichern auf', () => {
    speichereUmgebung(WOLFSBURG, [EDEKA], STAND_9_NOVEMBER_2026)
    const achtTageSpaeter = STAND_9_NOVEMBER_2026 + GUELTIGKEIT_MS + EINE_STUNDE_MS

    speichereUmgebung(ANDERER_ORT, [], achtTageSpaeter)

    expect(localStorage.getItem(ortsschluessel(WOLFSBURG))).toBeNull()
    expect(localStorage.getItem(ortsschluessel(ANDERER_ORT))).not.toBeNull()
  })

  it('ignoriert beschädigte Einträge', () => {
    localStorage.setItem(ortsschluessel(WOLFSBURG), '{"stand": "gestern", "orte": 5}')

    expect(leseGespeicherteUmgebung(WOLFSBURG, STAND_9_NOVEMBER_2026)).toBeNull()
  })
})

describe('ladeUmgebungMitZwischenspeicher', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('fragt beim ersten Mal den Dienst an und speichert das Ergebnis', async () => {
    const dienst = vi.fn().mockResolvedValue([EDEKA])

    const geladen = await ladeUmgebungMitZwischenspeicher(
      WOLFSBURG,
      undefined,
      dienst,
      () => STAND_9_NOVEMBER_2026,
    )

    expect(dienst).toHaveBeenCalledTimes(1)
    expect(geladen).toEqual({
      orte: [EDEKA],
      stand: STAND_9_NOVEMBER_2026,
      ausZwischenspeicher: false,
    })
  })

  it('antwortet beim zweiten Mal sofort aus dem Zwischenspeicher', async () => {
    const dienst = vi.fn().mockResolvedValue([EDEKA])
    const amNaechstenTag = () => STAND_9_NOVEMBER_2026 + 24 * EINE_STUNDE_MS
    await ladeUmgebungMitZwischenspeicher(WOLFSBURG, undefined, dienst, () => STAND_9_NOVEMBER_2026)

    const geladen = await ladeUmgebungMitZwischenspeicher(
      WOLFSBURG,
      undefined,
      dienst,
      amNaechstenTag,
    )

    expect(dienst).toHaveBeenCalledTimes(1)
    expect(geladen.ausZwischenspeicher).toBe(true)
    expect(geladen.stand).toBe(STAND_9_NOVEMBER_2026)
  })

  it('speichert nichts, wenn der Dienst nicht antwortet', async () => {
    const dienst = vi.fn().mockRejectedValue(new TypeError('offline'))

    await expect(ladeUmgebungMitZwischenspeicher(WOLFSBURG, undefined, dienst)).rejects.toThrow(
      'offline',
    )
    expect(localStorage.getItem(ortsschluessel(WOLFSBURG))).toBeNull()
  })
})
