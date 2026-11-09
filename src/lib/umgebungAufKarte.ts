import L from 'leaflet'
import { formatiereLaenge } from '@/lib/format'
import { alsSichererText } from '@/lib/kartenText'
import type { KategorieErgebnis, Koordinate, NaechsterOrt, UmgebungsAuswertung } from '@/types'

const MARKER_GROESSE_PX = 30
const KARTEN_INNENABSTAND_PX: L.PointTuple = [16, 16]
const NICHT_BEARBEITBAR = { pmIgnore: true } as const

export interface UmgebungAufKarte {
  zeige(auswertung: UmgebungsAuswertung | null): void
}

function alsLatLng({ lat, lon }: Koordinate): L.LatLngTuple {
  return [lat, lon]
}

function beschriftung(ergebnis: KategorieErgebnis, naechster: NaechsterOrt): string {
  return `${ergebnis.bezeichnung}: ${naechster.ort.name} (${formatiereLaenge(naechster.abstandM)})`
}

function erstelleKategorieIcon(symbol: string): L.DivIcon {
  return L.divIcon({
    className: 'umgebung-marker',
    html: alsSichererText(symbol),
    iconSize: [MARKER_GROESSE_PX, MARKER_GROESSE_PX],
    tooltipAnchor: [0, -MARKER_GROESSE_PX / 2],
  })
}

function erstelleKartenobjekt(ergebnis: KategorieErgebnis, naechster: NaechsterOrt): L.Layer {
  const text = beschriftung(ergebnis, naechster)
  const { geometrie } = naechster.ort

  if (geometrie.art === 'linie') {
    return L.polyline(geometrie.verlauf.map(alsLatLng), {
      ...NICHT_BEARBEITBAR,
      className: 'umgebung-strasse',
    }).bindTooltip(alsSichererText(text), { sticky: true })
  }

  return L.marker(alsLatLng(geometrie.position), {
    ...NICHT_BEARBEITBAR,
    icon: erstelleKategorieIcon(ergebnis.symbol),
    title: text,
    alt: text,
  }).bindTooltip(alsSichererText(text), { direction: 'top' })
}

function erstelleUmkreis(auswertung: UmgebungsAuswertung): L.Circle {
  return L.circle(alsLatLng(auswertung.mittelpunkt), {
    ...NICHT_BEARBEITBAR,
    radius: auswertung.umkreisM,
    className: 'umgebung-umkreis',
    interactive: false,
  })
}

export function erstelleUmgebungAufKarte(karte: L.Map): UmgebungAufKarte {
  const ebene = L.layerGroup([], NICHT_BEARBEITBAR).addTo(karte)

  function zeige(auswertung: UmgebungsAuswertung | null): void {
    ebene.clearLayers()
    if (!auswertung) return

    const umkreis = erstelleUmkreis(auswertung).addTo(ebene)
    for (const ergebnis of auswertung.ergebnisse) {
      if (ergebnis.naechsterOrt) {
        erstelleKartenobjekt(ergebnis, ergebnis.naechsterOrt).addTo(ebene)
      }
    }
    karte.fitBounds(umkreis.getBounds(), { padding: KARTEN_INNENABSTAND_PX })
  }

  return { zeige }
}
