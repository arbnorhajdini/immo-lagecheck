<script setup lang="ts">
import { OBJEKTARTEN, type Objektart } from '@/lib/objektart'

const objektart = defineModel<Objektart>('objektart', { required: true })
</script>

<template>
  <section class="rounded-lg border border-border bg-surface p-4 shadow-sm">
    <fieldset>
      <legend class="text-base font-semibold text-fg">Objektart</legend>
      <div class="mt-3 grid grid-cols-3 gap-2">
        <label
          v-for="art in OBJEKTARTEN"
          :key="art.schluessel"
          :title="art.bezeichnung"
          class="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-fg has-checked:border-primary has-checked:bg-surface-muted has-focus-visible:outline-2 has-focus-visible:outline-focus"
        >
          <input
            type="radio"
            name="objektart"
            class="accent-primary"
            :value="art.schluessel"
            :checked="objektart.schluessel === art.schluessel"
            @change="objektart = art"
          />
          {{ art.kurzbezeichnung }}
        </label>
      </div>
    </fieldset>
  </section>
</template>
