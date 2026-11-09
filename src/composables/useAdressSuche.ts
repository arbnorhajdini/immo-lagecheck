import { computed, ref } from 'vue'
import { NominatimFehler, sucheAdresse } from '@/lib/nominatim'
import type { AdressTreffer } from '@/types'

export type SuchStatus = 'bereit' | 'laedt' | 'gefunden' | 'nichtsGefunden' | 'fehler'

export const MIN_SUCHBEGRIFF_LAENGE = 3
const HTTP_STATUS_ZU_VIELE_ANFRAGEN = 429

function verstaendlicheFehlermeldung(fehler: unknown): string {
  if (fehler instanceof NominatimFehler && fehler.status === HTTP_STATUS_ZU_VIELE_ANFRAGEN) {
    return 'Zu viele Anfragen. Bitte einen Moment warten und erneut suchen.'
  }
  if (fehler instanceof TypeError) {
    return 'Keine Verbindung zum Suchdienst. Bitte Internetverbindung prüfen.'
  }
  return 'Die Adresssuche ist gerade nicht erreichbar. Bitte später erneut versuchen.'
}

function trefferAnzahlText(anzahl: number): string {
  return anzahl === 1
    ? '1 Adresse gefunden.'
    : `${anzahl} Adressen gefunden. Bitte die passende auswählen.`
}

export function statusTextFuer(
  status: SuchStatus,
  trefferAnzahl: number,
  fehlermeldung: string,
): string {
  switch (status) {
    case 'bereit':
      return ''
    case 'laedt':
      return 'Suche läuft …'
    case 'gefunden':
      return trefferAnzahlText(trefferAnzahl)
    case 'nichtsGefunden':
      return 'Keine Adresse gefunden. Bitte Schreibweise prüfen oder Ort ergänzen.'
    case 'fehler':
      return fehlermeldung
  }
}

export function useAdressSuche(sucheBeimDienst = sucheAdresse) {
  const suchbegriff = ref('')
  const status = ref<SuchStatus>('bereit')
  const treffer = ref<AdressTreffer[]>([])
  const fehlermeldung = ref('')
  let laufendeAnfrage: AbortController | null = null

  const laedt = computed(() => status.value === 'laedt')

  const statusText = computed(() =>
    statusTextFuer(status.value, treffer.value.length, fehlermeldung.value),
  )

  function zeigeFehler(meldung: string): void {
    treffer.value = []
    fehlermeldung.value = meldung
    status.value = 'fehler'
  }

  function zeigeTreffer(gefunden: AdressTreffer[]): void {
    treffer.value = gefunden
    status.value = gefunden.length > 0 ? 'gefunden' : 'nichtsGefunden'
  }

  function ersetzeLaufendeAnfrage(): AbortSignal {
    laufendeAnfrage?.abort()
    laufendeAnfrage = new AbortController()
    return laufendeAnfrage.signal
  }

  async function suchen(): Promise<AdressTreffer[]> {
    const bereinigterSuchbegriff = suchbegriff.value.trim()
    if (bereinigterSuchbegriff.length < MIN_SUCHBEGRIFF_LAENGE) {
      zeigeFehler(`Bitte mindestens ${MIN_SUCHBEGRIFF_LAENGE} Zeichen eingeben.`)
      return []
    }

    const signal = ersetzeLaufendeAnfrage()
    status.value = 'laedt'

    try {
      const gefunden = await sucheBeimDienst(bereinigterSuchbegriff, signal)
      if (signal.aborted) return []
      zeigeTreffer(gefunden)
      return gefunden
    } catch (fehler) {
      if (!signal.aborted) zeigeFehler(verstaendlicheFehlermeldung(fehler))
      return []
    }
  }

  return { suchbegriff, status, treffer, laedt, statusText, suchen }
}
