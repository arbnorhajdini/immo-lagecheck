import { computed, ref } from 'vue'
import { type ExposeAuftrag, speichereExposeAlsPdf } from '@/lib/expose'

export type ExportStatus = 'bereit' | 'laedt' | 'gespeichert' | 'fehler'

export function exportMeldungFuer(status: ExportStatus, dateiname: string): string {
  switch (status) {
    case 'bereit':
      return ''
    case 'laedt':
      return 'PDF wird erstellt … Kartenausschnitte werden geladen.'
    case 'gespeichert':
      return `PDF gespeichert: ${dateiname}`
    case 'fehler':
      return 'Das PDF konnte nicht erstellt werden. Bitte Internetverbindung prüfen und erneut versuchen.'
  }
}

export function useExposeExport(speichere = speichereExposeAlsPdf) {
  const status = ref<ExportStatus>('bereit')
  const dateiname = ref('')

  const laedt = computed(() => status.value === 'laedt')
  const meldung = computed(() => exportMeldungFuer(status.value, dateiname.value))

  async function speichereAlsPdf(auftrag: ExposeAuftrag): Promise<void> {
    status.value = 'laedt'
    try {
      dateiname.value = await speichere(auftrag)
      status.value = 'gespeichert'
    } catch {
      status.value = 'fehler'
    }
  }

  return { status, laedt, meldung, speichereAlsPdf }
}
