<script setup lang="ts">
import { computed } from 'vue'
import type { UmgebungsStatus } from '@/composables/useUmgebung'
import { formatiereLaenge } from '@/lib/format'
import type { UmgebungsAuswertung } from '@/types'

const props = defineProps<{
  auswertung: UmgebungsAuswertung | null
  status: UmgebungsStatus
  statusText: string
  kannPruefen: boolean
  hatGrundstueck: boolean
}>()
const emit = defineEmits<{ pruefen: [] }>()

const laedt = computed(() => props.status === 'laedt')
const istFehler = computed(() => props.status === 'fehler')
const umkreisText = computed(() => formatiereLaenge(props.auswertung?.umkreisM ?? 0))
</script>

<template>
  <section
    aria-labelledby="umgebung-titel"
    class="rounded-lg border border-border bg-surface p-4 shadow-sm"
  >
    <h2 id="umgebung-titel" class="text-base font-semibold text-fg">3. Umgebung prüfen</h2>

    <button
      type="button"
      :disabled="!kannPruefen"
      :aria-describedby="hatGrundstueck ? undefined : 'umgebung-hinweis'"
      class="mt-3 w-full cursor-pointer rounded-md bg-primary px-4 py-2 font-medium text-primary-contrast transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      @click="emit('pruefen')"
    >
      {{ laedt ? 'Umgebung wird geprüft …' : 'Umgebung prüfen' }}
    </button>

    <p v-if="!hatGrundstueck" id="umgebung-hinweis" class="mt-2 text-sm text-muted">
      Zuerst ein Grundstück einzeichnen.
    </p>

    <p
      role="status"
      aria-live="polite"
      class="mt-2 min-h-5 text-sm"
      :class="istFehler ? 'text-danger' : 'text-muted'"
    >
      {{ statusText }}
    </p>

    <ul v-if="auswertung" class="mt-1 divide-y divide-border">
      <li
        v-for="ergebnis in auswertung.ergebnisse"
        :key="ergebnis.kategorie"
        class="flex items-start gap-3 py-2 text-sm"
      >
        <span aria-hidden="true" class="w-6 shrink-0 text-center text-base">
          {{ ergebnis.symbol }}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-medium text-fg">{{ ergebnis.bezeichnung }}</span>
          <span class="block truncate text-muted">
            {{ ergebnis.naechsterOrt?.ort.name ?? `nicht im Umkreis von ${umkreisText}` }}
          </span>
        </span>
        <span
          v-if="ergebnis.naechsterOrt"
          class="shrink-0 font-medium whitespace-nowrap text-fg tabular-nums"
        >
          {{ formatiereLaenge(ergebnis.naechsterOrt.abstandM) }}
        </span>
      </li>
    </ul>
  </section>
</template>
