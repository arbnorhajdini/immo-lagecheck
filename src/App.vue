<script setup lang="ts">
import { ref } from 'vue'
import AdressSuche from '@/components/AdressSuche.vue'
import AppHeader from '@/components/AppHeader.vue'
import KarteGrundstueck from '@/components/KarteGrundstueck.vue'
import type { AdressTreffer } from '@/types'

const adresse = ref<AdressTreffer | null>(null)
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader />

    <main
      class="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[24rem_1fr]"
    >
      <div class="flex flex-col gap-4">
        <AdressSuche v-model:adresse="adresse" />
      </div>

      <KarteGrundstueck :adresse="adresse" />
    </main>
  </div>
</template>
