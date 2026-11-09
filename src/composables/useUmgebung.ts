import { computed, ref, shallowRef, watch, type Ref } from 'vue'
import { formatiereLaenge } from '@/lib/format'
import { berechneMittelpunkt, type GrundstueckPolygon } from '@/lib/geometrie'
import { istZeitueberschreitung, ladeUmgebung, OverpassFehler } from '@/lib/overpass'
import { ermittleNaechsteOrte } from '@/lib/umgebung'
import { UMKREIS_M } from '@/lib/umgebungKategorien'
import type { UmgebungsAuswertung } from '@/types'

export type UmgebungsStatus = 'bereit' | 'laedt' | 'fertig' | 'fehler'

const HTTP_STATUS_ZU_VIELE_ANFRAGEN = 429
const HTTP_STATUS_DIENST_ANTWORTET_NICHT = new Set([502, 503, 504])

function dienstAntwortetNicht(fehler: unknown): boolean {
  return (
    istZeitueberschreitung(fehler) ||
    (fehler instanceof OverpassFehler && HTTP_STATUS_DIENST_ANTWORTET_NICHT.has(fehler.status))
  )
}

function verstaendlicheFehlermeldung(fehler: unknown): string {
  if (fehler instanceof OverpassFehler && fehler.status === HTTP_STATUS_ZU_VIELE_ANFRAGEN) {
    return 'Der Umgebungsdienst ist gerade ausgelastet. Bitte in einer Minute erneut prüfen.'
  }
  if (dienstAntwortetNicht(fehler)) {
    return 'Der Umgebungsdienst antwortet gerade nicht. Bitte gleich noch einmal prüfen.'
  }
  if (fehler instanceof TypeError) {
    return 'Keine Verbindung zum Umgebungsdienst. Bitte Internetverbindung prüfen.'
  }
  return 'Die Umgebung konnte gerade nicht geprüft werden. Bitte später erneut versuchen.'
}

export function statusTextFuer(
  status: UmgebungsStatus,
  auswertung: UmgebungsAuswertung | null,
  fehlermeldung: string,
): string {
  switch (status) {
    case 'bereit':
      return ''
    case 'laedt':
      return 'Umgebung wird geprüft … Bei ausgelasteten OpenStreetMap-Servern kann das bis zu einer Minute dauern.'
    case 'fehler':
      return fehlermeldung
    case 'fertig': {
      const ergebnisse = auswertung?.ergebnisse ?? []
      const gefunden = ergebnisse.filter(({ naechsterOrt }) => naechsterOrt !== null).length
      return `${gefunden} von ${ergebnisse.length} Kategorien im Umkreis von ${formatiereLaenge(UMKREIS_M)} gefunden.`
    }
  }
}

export function useUmgebung(
  grundstueck: Readonly<Ref<GrundstueckPolygon | null>>,
  ladeBeimDienst = ladeUmgebung,
) {
  const status = ref<UmgebungsStatus>('bereit')
  const auswertung = shallowRef<UmgebungsAuswertung | null>(null)
  const fehlermeldung = ref('')
  let laufendeAnfrage: AbortController | null = null

  const laedt = computed(() => status.value === 'laedt')
  const kannPruefen = computed(() => grundstueck.value !== null && !laedt.value)
  const statusText = computed(() =>
    statusTextFuer(status.value, auswertung.value, fehlermeldung.value),
  )

  function ersetzeLaufendeAnfrage(): AbortSignal {
    laufendeAnfrage?.abort()
    laufendeAnfrage = new AbortController()
    return laufendeAnfrage.signal
  }

  function setzeZurueck(): void {
    laufendeAnfrage?.abort()
    laufendeAnfrage = null
    auswertung.value = null
    status.value = 'bereit'
  }

  function zeigeFehler(fehler: unknown): void {
    fehlermeldung.value = verstaendlicheFehlermeldung(fehler)
    status.value = 'fehler'
  }

  async function pruefen(): Promise<void> {
    const gepruefteFlaeche = grundstueck.value
    if (!gepruefteFlaeche) return

    const signal = ersetzeLaufendeAnfrage()
    const mittelpunkt = berechneMittelpunkt(gepruefteFlaeche)
    auswertung.value = null
    status.value = 'laedt'

    try {
      const orte = await ladeBeimDienst(mittelpunkt, signal)
      if (signal.aborted) return
      const ergebnisse = ermittleNaechsteOrte(gepruefteFlaeche, orte)
      auswertung.value = { mittelpunkt, umkreisM: UMKREIS_M, ergebnisse }
      status.value = 'fertig'
    } catch (fehler) {
      if (!signal.aborted) zeigeFehler(fehler)
    }
  }

  watch(grundstueck, setzeZurueck)

  return { status, auswertung, laedt, kannPruefen, statusText, pruefen }
}
