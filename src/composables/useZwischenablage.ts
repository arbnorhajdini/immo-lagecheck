import { computed, getCurrentScope, onScopeDispose, ref } from 'vue'

export type KopierStatus = 'bereit' | 'kopiert' | 'fehler'

export const BESTAETIGUNG_SICHTBAR_MS = 2_500

const MELDUNGEN: Record<KopierStatus, string> = {
  bereit: '',
  kopiert: 'In die Zwischenablage kopiert.',
  fehler: 'Kopieren nicht möglich. Bitte den Text markieren und mit Strg+C bzw. ⌘+C kopieren.',
}

function schreibeInZwischenablage(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function useZwischenablage(schreibe = schreibeInZwischenablage) {
  const status = ref<KopierStatus>('bereit')
  const meldung = computed(() => MELDUNGEN[status.value])
  let zuruecksetzen: ReturnType<typeof setTimeout> | undefined

  function planeZuruecksetzen(): void {
    clearTimeout(zuruecksetzen)
    zuruecksetzen = setTimeout(() => {
      status.value = 'bereit'
    }, BESTAETIGUNG_SICHTBAR_MS)
  }

  async function kopiere(text: string): Promise<void> {
    try {
      await schreibe(text)
      status.value = 'kopiert'
      planeZuruecksetzen()
    } catch {
      clearTimeout(zuruecksetzen)
      status.value = 'fehler'
    }
  }

  if (getCurrentScope()) onScopeDispose(() => clearTimeout(zuruecksetzen))

  return { status, meldung, kopiere }
}
