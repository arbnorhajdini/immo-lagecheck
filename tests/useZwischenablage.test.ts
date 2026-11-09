import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BESTAETIGUNG_SICHTBAR_MS, useZwischenablage } from '@/composables/useZwischenablage'

describe('useZwischenablage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('kopiert den Text und bestätigt das', async () => {
    const schreibe = vi.fn().mockResolvedValue(undefined)
    const { status, meldung, kopiere } = useZwischenablage(schreibe)

    await kopiere('Lage-Steckbrief')

    expect(schreibe).toHaveBeenCalledWith('Lage-Steckbrief')
    expect(status.value).toBe('kopiert')
    expect(meldung.value).toBe('In die Zwischenablage kopiert.')
  })

  it('blendet die Bestätigung nach kurzer Zeit wieder aus', async () => {
    const { status, kopiere } = useZwischenablage(vi.fn().mockResolvedValue(undefined))

    await kopiere('Lage-Steckbrief')
    vi.advanceTimersByTime(BESTAETIGUNG_SICHTBAR_MS)

    expect(status.value).toBe('bereit')
  })

  it('erklärt den Weg von Hand, wenn der Browser das Kopieren verweigert', async () => {
    const verweigert = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
    const { status, meldung, kopiere } = useZwischenablage(verweigert)

    await kopiere('Lage-Steckbrief')

    expect(status.value).toBe('fehler')
    expect(meldung.value).toContain('markieren')
  })
})
