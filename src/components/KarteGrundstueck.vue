<script setup lang="ts">
import L from 'leaflet'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import type { GrundstueckPolygon } from '@/lib/geometrie'
import { aktiviereGrundstueckZeichnen, type GrundstueckZeichnen } from '@/lib/grundstueckZeichnen'
import type { AdressTreffer } from '@/types'

const props = defineProps<{ adresse: AdressTreffer | null }>()
const grundstueck = defineModel<GrundstueckPolygon | null>('grundstueck', { default: null })

const DEUTSCHLAND_MITTE: L.LatLngTuple = [51.1657, 10.4515]
const UEBERSICHTS_ZOOM = 6
const ADRESS_ZOOM = 18
const MAX_KACHEL_ZOOM = 19
const KARTEN_INNENABSTAND_PX: L.PointTuple = [24, 24]
const OSM_KACHEL_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'

const ADRESS_MARKER_ICON = L.divIcon({
  className: 'adress-marker',
  html: `<svg viewBox="0 0 32 40" width="32" height="40" aria-hidden="true">
      <path class="adress-marker__pin" d="M16 1C7.7 1 1 7.5 1 15.6 1 26.4 16 39 16 39s15-12.6 15-23.4C31 7.5 24.3 1 16 1z"/>
      <circle class="adress-marker__punkt" cx="16" cy="15.5" r="5.5"/>
    </svg>`,
  iconSize: [32, 40],
  iconAnchor: [16, 39],
  tooltipAnchor: [0, -36],
})

const kartenElement = useTemplateRef<HTMLDivElement>('karte')

let karte: L.Map | null = null
let adressMarker: L.Marker | null = null
let grundstueckZeichnen: GrundstueckZeichnen | null = null

function bewegungIstReduziert(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function erstelleKarte(element: HTMLElement): L.Map {
  const neueKarte = L.map(element, {
    center: DEUTSCHLAND_MITTE,
    zoom: UEBERSICHTS_ZOOM,
    zoomControl: false,
  })
  L.control.zoom({ zoomInTitle: 'Vergrößern', zoomOutTitle: 'Verkleinern' }).addTo(neueKarte)
  L.tileLayer(OSM_KACHEL_URL, { maxZoom: MAX_KACHEL_ZOOM, attribution: OSM_ATTRIBUTION }).addTo(
    neueKarte,
  )
  return neueKarte
}

function entferneAdressMarker(): void {
  adressMarker?.remove()
  adressMarker = null
}

function setzeAdressMarker(aktiveKarte: L.Map, adresse: AdressTreffer): void {
  adressMarker = L.marker([adresse.lat, adresse.lon], {
    icon: ADRESS_MARKER_ICON,
    title: adresse.kurzName,
    alt: adresse.kurzName,
  })
    .bindTooltip(adresse.kurzName, { direction: 'top' })
    .addTo(aktiveKarte)
}

function zeigeAusschnitt(aktiveKarte: L.Map, adresse: AdressTreffer): void {
  const animate = !bewegungIstReduziert()
  if (!adresse.begrenzung) {
    aktiveKarte.setView([adresse.lat, adresse.lon], ADRESS_ZOOM, { animate })
    return
  }
  const { sued, west, nord, ost } = adresse.begrenzung
  aktiveKarte.fitBounds(
    [
      [sued, west],
      [nord, ost],
    ],
    { maxZoom: ADRESS_ZOOM, padding: KARTEN_INNENABSTAND_PX, animate },
  )
}

function zeigeAdresse(adresse: AdressTreffer | null): void {
  entferneAdressMarker()
  if (!karte || !adresse) return
  setzeAdressMarker(karte, adresse)
  zeigeAusschnitt(karte, adresse)
}

function entferneGezeichnetesGrundstueck(neuesGrundstueck: GrundstueckPolygon | null): void {
  if (neuesGrundstueck === null) grundstueckZeichnen?.entferneGrundstueck()
}

onMounted(() => {
  if (!kartenElement.value) return
  karte = erstelleKarte(kartenElement.value)
  grundstueckZeichnen = aktiviereGrundstueckZeichnen(karte, (gezeichnet) => {
    grundstueck.value = gezeichnet
  })
  zeigeAdresse(props.adresse)
})

watch(() => props.adresse, zeigeAdresse)
watch(grundstueck, entferneGezeichnetesGrundstueck)

onBeforeUnmount(() => {
  entferneAdressMarker()
  karte?.remove()
  karte = null
  grundstueckZeichnen = null
})
</script>

<template>
  <section
    aria-label="Karte"
    class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
  >
    <div ref="karte" class="h-[60vh] min-h-80 w-full lg:h-full lg:min-h-[32rem]"></div>
  </section>
</template>
