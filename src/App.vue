<script setup lang="ts">
import { computed, ref } from 'vue'
import AdressSuche from '@/components/AdressSuche.vue'
import AppHeader from '@/components/AppHeader.vue'
import GrundstueckAngaben from '@/components/GrundstueckAngaben.vue'
import KarteGrundstueck from '@/components/KarteGrundstueck.vue'
import LageSteckbrief from '@/components/LageSteckbrief.vue'
import UmgebungListe from '@/components/UmgebungListe.vue'
import { useGrundstueck } from '@/composables/useGrundstueck'
import { useUmgebung } from '@/composables/useUmgebung'
import type { AdressTreffer } from '@/types'

const adresse = ref<AdressTreffer | null>(null)
const { grundstueck, masse, entferneGrundstueck } = useGrundstueck()
const { auswertung, status, statusText, kannPruefen, pruefen } = useUmgebung(grundstueck)
const hatGrundstueck = computed(() => grundstueck.value !== null)
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader />

    <main
      class="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[24rem_1fr]"
    >
      <div class="flex flex-col gap-4">
        <AdressSuche v-model:adresse="adresse" />
        <GrundstueckAngaben :masse="masse" @entfernen="entferneGrundstueck" />
        <UmgebungListe
          :auswertung="auswertung"
          :status="status"
          :status-text="statusText"
          :kann-pruefen="kannPruefen"
          :hat-grundstueck="hatGrundstueck"
          @pruefen="pruefen"
        />
        <LageSteckbrief :adresse="adresse" :masse="masse" :auswertung="auswertung" />
      </div>

      <KarteGrundstueck
        v-model:grundstueck="grundstueck"
        :adresse="adresse"
        :umgebung="auswertung"
      />
    </main>
  </div>
</template>
