<script setup lang="ts">
import { computed } from 'vue'
import { useAdressSuche } from '@/composables/useAdressSuche'
import type { AdressTreffer } from '@/types'

const adresse = defineModel<AdressTreffer | null>('adresse', { default: null })

const { suchbegriff, status, treffer, laedt, statusText, suchen } = useAdressSuche()

const istFehler = computed(() => status.value === 'fehler')

async function sucheUndWaehleBestenTreffer(): Promise<void> {
  const [besterTreffer] = await suchen()
  if (besterTreffer) adresse.value = besterTreffer
}
</script>

<template>
  <section
    aria-labelledby="adresse-titel"
    class="rounded-lg border border-border bg-surface p-4 shadow-sm"
  >
    <h2 id="adresse-titel" class="text-base font-semibold text-fg">1. Adresse suchen</h2>

    <form role="search" class="mt-3" novalidate @submit.prevent="sucheUndWaehleBestenTreffer">
      <label for="adresse-eingabe" class="block text-sm font-medium text-fg">
        Straße, Hausnummer, Ort
      </label>
      <div class="mt-1 flex gap-2">
        <input
          id="adresse-eingabe"
          v-model="suchbegriff"
          type="search"
          name="adresse"
          autocomplete="street-address"
          enterkeyhint="search"
          placeholder="z. B. Marienplatz 1, München"
          :aria-invalid="istFehler ? 'true' : undefined"
          aria-describedby="adresse-status"
          class="min-w-0 flex-1 rounded-md border border-border-control bg-surface px-3 py-2 text-fg placeholder:text-muted"
        />
        <button
          type="submit"
          :disabled="laedt"
          class="shrink-0 cursor-pointer rounded-md bg-primary px-4 py-2 font-medium text-primary-contrast transition-colors hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"
        >
          {{ laedt ? 'Suche …' : 'Suchen' }}
        </button>
      </div>
    </form>

    <p
      id="adresse-status"
      role="status"
      aria-live="polite"
      class="mt-2 min-h-5 text-sm"
      :class="istFehler ? 'text-danger' : 'text-muted'"
    >
      {{ statusText }}
    </p>

    <fieldset v-if="treffer.length > 1" class="mt-2">
      <legend class="text-sm font-medium text-fg">Treffer</legend>
      <ul class="mt-1 flex flex-col gap-1">
        <li v-for="eintrag in treffer" :key="eintrag.id">
          <label
            class="flex cursor-pointer gap-2 rounded-md border border-border px-3 py-2 text-sm text-fg has-checked:border-primary has-checked:bg-surface-muted has-focus-visible:outline-2 has-focus-visible:outline-focus"
          >
            <input
              type="radio"
              name="adress-treffer"
              class="mt-0.5 accent-primary"
              :value="eintrag.id"
              :checked="adresse?.id === eintrag.id"
              @change="adresse = eintrag"
            />
            <span>
              <span class="block font-medium">{{ eintrag.kurzName }}</span>
              <span class="block text-xs text-muted">{{ eintrag.vollName }}</span>
            </span>
          </label>
        </li>
      </ul>
    </fieldset>

    <p v-else-if="adresse" class="mt-1 text-sm text-fg">
      <span class="text-muted">Ausgewählt:</span> {{ adresse.kurzName }}
    </p>
  </section>
</template>
