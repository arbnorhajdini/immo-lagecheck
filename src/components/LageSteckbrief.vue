<script setup lang="ts">
import { computed } from 'vue'
import { useExposeExport } from '@/composables/useExposeExport'
import { useZwischenablage } from '@/composables/useZwischenablage'
import type { Bezugsobjekt, GrundstueckMasse } from '@/lib/geometrie'
import { type Objektart, steckbriefVoraussetzungText } from '@/lib/objektart'
import { erstelleSteckbrief } from '@/lib/steckbrief'
import type { AdressTreffer, UmgebungsAuswertung } from '@/types'

const props = defineProps<{
  objektart: Objektart
  adresse: AdressTreffer | null
  bezug: Bezugsobjekt | null
  masse: GrundstueckMasse | null
  auswertung: UmgebungsAuswertung | null
  nummer: number | null
}>()

const { status: kopierStatus, meldung: kopierMeldung, kopiere } = useZwischenablage()
const {
  status: exportStatus,
  laedt: pdfWirdErstellt,
  meldung: exportMeldung,
  speichereAlsPdf,
} = useExposeExport()

const steckbrief = computed(() =>
  props.bezug
    ? erstelleSteckbrief({
        objektart: props.objektart,
        adresse: props.adresse,
        masse: props.masse,
        auswertung: props.auswertung,
      })
    : '',
)
const zeilenAnzahl = computed(() => steckbrief.value.split('\n').length)

function speichereExpose(): void {
  if (!props.bezug) return
  speichereAlsPdf({
    objektart: props.objektart,
    adresse: props.adresse,
    bezug: props.bezug,
    masse: props.masse,
    auswertung: props.auswertung,
  })
}
</script>

<template>
  <section
    aria-labelledby="steckbrief-titel"
    class="rounded-lg border border-border bg-surface p-4 shadow-sm"
  >
    <h2 id="steckbrief-titel" class="text-base font-semibold text-fg">
      {{ nummer }}. Lage-Steckbrief
    </h2>

    <p v-if="!bezug" class="mt-2 text-sm text-muted">
      {{ steckbriefVoraussetzungText(objektart) }}
    </p>

    <template v-else>
      <label for="steckbrief-text" class="mt-2 block text-sm text-muted">
        Zum Einfügen ins Exposé
      </label>
      <textarea
        id="steckbrief-text"
        readonly
        :value="steckbrief"
        :rows="zeilenAnzahl"
        class="mt-1 field-sizing-content w-full resize-none rounded-md border border-border-control bg-surface-muted p-3 text-sm text-fg"
      ></textarea>

      <div class="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          class="cursor-pointer rounded-md bg-primary px-4 py-2 font-medium text-primary-contrast transition-colors hover:bg-primary-hover"
          @click="kopiere(steckbrief)"
        >
          Kopieren
        </button>
        <button
          type="button"
          :disabled="pdfWirdErstellt"
          class="cursor-pointer rounded-md border border-primary px-4 py-2 font-medium text-primary transition-colors hover:bg-surface-muted disabled:cursor-wait disabled:opacity-70"
          @click="speichereExpose"
        >
          {{ pdfWirdErstellt ? 'PDF wird erstellt …' : 'Als PDF-Exposé speichern' }}
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        class="mt-2 min-h-5 text-sm"
        :class="kopierStatus === 'fehler' ? 'text-danger' : 'text-success'"
      >
        {{ kopierMeldung }}
      </p>
      <p
        role="status"
        aria-live="polite"
        class="min-h-5 text-sm break-words"
        :class="{
          'text-danger': exportStatus === 'fehler',
          'text-success': exportStatus === 'gespeichert',
          'text-muted': exportStatus === 'laedt',
        }"
      >
        {{ exportMeldung }}
      </p>
    </template>
  </section>
</template>
