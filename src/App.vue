<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import AdressSuche from '@/components/AdressSuche.vue'
import AppHeader from '@/components/AppHeader.vue'
import GrundstueckAngaben from '@/components/GrundstueckAngaben.vue'
import KarteGrundstueck from '@/components/KarteGrundstueck.vue'
import LageSteckbrief from '@/components/LageSteckbrief.vue'
import ObjektartWahl from '@/components/ObjektartWahl.vue'
import UmgebungListe from '@/components/UmgebungListe.vue'
import { useGrundstueck } from '@/composables/useGrundstueck'
import { useGrundstuecksadresse } from '@/composables/useGrundstuecksadresse'
import { useUmgebung } from '@/composables/useUmgebung'
import {
  bezugsobjektFuer,
  fehlenderSchrittText,
  type Objektart,
  schrittnummern,
  STANDARD_OBJEKTART,
} from '@/lib/objektart'
import type { AdressTreffer } from '@/types'

const objektart = shallowRef<Objektart>(STANDARD_OBJEKTART)
const adresse = ref<AdressTreffer | null>(null)
const { grundstueck, masse, entferneGrundstueck } = useGrundstueck()

const bezug = computed(() => bezugsobjektFuer(objektart.value, adresse.value, grundstueck.value))
const nummern = computed(() => schrittnummern(objektart.value))
const mitGrundstueck = computed(() => objektart.value.mitGrundstueck)

const { auswertung, status, statusText, kannPruefen, pruefen } = useUmgebung(bezug)
const { wirksameAdresse, hinweis: adresshinweis } = useGrundstuecksadresse(adresse, grundstueck)

watch(mitGrundstueck, (grundstueckErlaubt) => {
  if (!grundstueckErlaubt) entferneGrundstueck()
})
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader />

    <main
      class="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[24rem_1fr]"
    >
      <div class="flex flex-col gap-4">
        <ObjektartWahl v-model:objektart="objektart" />
        <AdressSuche v-model:adresse="adresse" :nummer="nummern.adresse" />
        <GrundstueckAngaben
          v-if="mitGrundstueck"
          :masse="masse"
          :nummer="nummern.grundstueck"
          :adresshinweis="adresshinweis"
          @entfernen="entferneGrundstueck"
        />
        <UmgebungListe
          :auswertung="auswertung"
          :status="status"
          :status-text="statusText"
          :kann-pruefen="kannPruefen"
          :hat-bezug="bezug !== null"
          :hinweis="fehlenderSchrittText(objektart)"
          :nummer="nummern.umgebung"
          @pruefen="pruefen"
        />
        <LageSteckbrief
          :objektart="objektart"
          :adresse="wirksameAdresse"
          :bezug="bezug"
          :masse="mitGrundstueck ? masse : null"
          :auswertung="auswertung"
          :nummer="nummern.steckbrief"
        />
      </div>

      <KarteGrundstueck
        v-model:grundstueck="grundstueck"
        :adresse="adresse"
        :umgebung="auswertung"
        :zeichnen-aktiv="mitGrundstueck"
      />
    </main>
  </div>
</template>
