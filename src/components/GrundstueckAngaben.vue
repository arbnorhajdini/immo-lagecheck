<script setup lang="ts">
import { computed } from 'vue'
import { formatiereFlaeche, formatiereLaenge } from '@/lib/format'
import type { GrundstueckMasse } from '@/lib/geometrie'

const props = defineProps<{ masse: GrundstueckMasse | null }>()
const emit = defineEmits<{ entfernen: [] }>()

const flaeche = computed(() => (props.masse ? formatiereFlaeche(props.masse.flaecheQm) : ''))
const umfang = computed(() => (props.masse ? formatiereLaenge(props.masse.umfangM) : ''))
</script>

<template>
  <section
    aria-labelledby="grundstueck-titel"
    class="rounded-lg border border-border bg-surface p-4 shadow-sm"
  >
    <h2 id="grundstueck-titel" class="text-base font-semibold text-fg">
      2. Grundstück einzeichnen
    </h2>

    <div aria-live="polite" class="mt-2">
      <dl v-if="masse" class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt class="text-muted">Fläche</dt>
        <dd class="font-medium text-fg tabular-nums">{{ flaeche }}</dd>
        <dt class="text-muted">Umfang</dt>
        <dd class="font-medium text-fg tabular-nums">{{ umfang }}</dd>
      </dl>

      <p v-else class="text-sm text-muted">
        In der Karte „Grundstück als Vieleck zeichnen“ oder „als Rechteck“ wählen und die Ecken
        anklicken. Zum Abschließen den ersten Eckpunkt erneut anklicken.
      </p>
    </div>

    <button
      v-if="masse"
      type="button"
      class="mt-3 cursor-pointer rounded-md border border-border-control px-3 py-1.5 text-sm text-fg transition-colors hover:bg-surface-muted"
      @click="emit('entfernen')"
    >
      Grundstück entfernen
    </button>
  </section>
</template>
