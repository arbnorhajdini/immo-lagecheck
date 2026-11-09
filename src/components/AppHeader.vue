<script setup lang="ts">
import { useTheme, type ThemeModus } from '@/composables/useTheme'

const { gewaehlterModus, setzeModus } = useTheme()

const THEME_OPTIONEN: { modus: ThemeModus; beschriftung: string }[] = [
  { modus: 'light', beschriftung: 'Hell' },
  { modus: 'dark', beschriftung: 'Dunkel' },
  { modus: 'system', beschriftung: 'System' },
]
</script>

<template>
  <header class="border-b border-border bg-surface">
    <div
      class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"
    >
      <div>
        <h1 class="text-lg font-semibold text-fg sm:text-xl">Lage-Check</h1>
        <p class="text-sm text-muted">Grundstück und Umgebung auf einen Blick</p>
      </div>

      <fieldset class="flex rounded-md border border-border-control bg-surface-muted p-0.5">
        <legend class="sr-only">Farbschema</legend>
        <label
          v-for="option in THEME_OPTIONEN"
          :key="option.modus"
          class="cursor-pointer rounded-sm px-3 py-1 text-sm text-muted transition-colors has-checked:bg-primary has-checked:text-primary-contrast has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-focus"
        >
          <input
            type="radio"
            name="theme"
            class="sr-only"
            :value="option.modus"
            :checked="gewaehlterModus === option.modus"
            @change="setzeModus(option.modus)"
          />
          {{ option.beschriftung }}
        </label>
      </fieldset>
    </div>
  </header>
</template>
