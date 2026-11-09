<script setup lang="ts">
import { computed } from 'vue'
import { useZwischenablage } from '@/composables/useZwischenablage'
import type { GrundstueckMasse } from '@/lib/geometrie'
import { erstelleSteckbrief } from '@/lib/steckbrief'
import type { AdressTreffer, UmgebungsAuswertung } from '@/types'

const props = defineProps<{
  adresse: AdressTreffer | null
  masse: GrundstueckMasse | null
  auswertung: UmgebungsAuswertung | null
}>()

const { status, meldung, kopiere } = useZwischenablage()

const steckbrief = computed(() =>
  props.masse
    ? erstelleSteckbrief({
        adresse: props.adresse,
        masse: props.masse,
        auswertung: props.auswertung,
      })
    : '',
)
const zeilenAnzahl = computed(() => steckbrief.value.split('\n').length)
</script>

<template>
  <section
    aria-labelledby="steckbrief-titel"
    class="rounded-lg border border-border bg-surface p-4 shadow-sm"
  >
    <h2 id="steckbrief-titel" class="text-base font-semibold text-fg">4. Lage-Steckbrief</h2>

    <p v-if="!masse" class="mt-2 text-sm text-muted">
      Erscheint, sobald ein Grundstück eingezeichnet ist.
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

      <div class="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="cursor-pointer rounded-md bg-primary px-4 py-2 font-medium text-primary-contrast transition-colors hover:bg-primary-hover"
          @click="kopiere(steckbrief)"
        >
          Kopieren
        </button>
        <p
          role="status"
          aria-live="polite"
          class="min-h-5 flex-1 text-sm"
          :class="status === 'fehler' ? 'text-danger' : 'text-success'"
        >
          {{ meldung }}
        </p>
      </div>
    </template>
  </section>
</template>
