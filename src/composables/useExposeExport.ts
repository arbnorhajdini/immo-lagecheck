import { computed, ref } from 'vue'
import { type ExposeAuftrag, speichereExposeAlsPdf } from '@/lib/expose'
import { istModulLadefehler, ladeJsPdfImVoraus } from '@/lib/jsPdfLaden'

export type ExportStatus = 'bereit' | 'laedt' | 'gespeichert' | 'veraltet' | 'fehler'

export function exportMeldungFuer(status: ExportStatus, dateiname: string): string {
  switch (status) {
    case 'bereit':
      return ''
    case 'laedt':
      return 'PDF wird erstellt … Kartenausschnitte werden geladen.'
    case 'gespeichert':
      return `PDF gespeichert: ${dateiname}`
    case 'veraltet':
      return 'Die App wurde inzwischen aktualisiert. Bitte die Seite neu laden und das PDF erneut erstellen.'
    case 'fehler':
      return 'Das PDF konnte nicht erstellt werden. Bitte erneut versuchen.'
  }
}

export function useExposeExport(speichere = speichereExposeAlsPdf, bereiteVor = ladeJsPdfImVoraus) {
  const status = ref<ExportStatus>('bereit')
  const dateiname = ref('')

  const laedt = computed(() => status.value === 'laedt')
  const istVeraltet = computed(() => status.value === 'veraltet')
  const meldung = computed(() => exportMeldungFuer(status.value, dateiname.value))

  function meldeFehler(fehler: unknown): void {
    console.error('PDF-Export fehlgeschlagen', fehler)
    status.value = istModulLadefehler(fehler) ? 'veraltet' : 'fehler'
  }

  async function speichereAlsPdf(auftrag: ExposeAuftrag): Promise<void> {
    status.value = 'laedt'
    try {
      dateiname.value = await speichere(auftrag)
      status.value = 'gespeichert'
    } catch (fehler) {
      meldeFehler(fehler)
    }
  }

  return { status, laedt, istVeraltet, meldung, speichereAlsPdf, bereiteVor }
}
