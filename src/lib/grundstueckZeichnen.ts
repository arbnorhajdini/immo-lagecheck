import L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import type { GrundstueckPolygon } from '@/lib/geometrie'

export const GRUNDSTUECK_KLASSE = 'grundstueck-flaeche'
export const ZEICHENLINIE_KLASSE = 'grundstueck-zeichenlinie'

const MAKLERFREUNDLICHE_TEXTE: L.PM.Translations = {
  tooltips: {
    firstVertex: 'Ersten Eckpunkt mit Klick setzen',
    continueLine: 'Nächsten Eckpunkt mit Klick setzen',
    finishPoly: 'Zum Abschließen auf den ersten Eckpunkt klicken',
    finishRect: 'Mit Klick abschließen',
  },
  actions: {
    finish: 'Fertig',
    cancel: 'Abbrechen',
    removeLastVertex: 'Letzten Eckpunkt löschen',
  },
  buttonTitles: {
    drawPolyButton: 'Grundstück als Vieleck zeichnen',
    drawRectButton: 'Grundstück als Rechteck zeichnen',
    editButton: 'Eckpunkte bearbeiten',
    dragButton: 'Grundstück verschieben',
    deleteButton: 'Grundstück löschen',
  },
}

export interface GrundstueckZeichnen {
  entferneGrundstueck(): void
  zeigeWerkzeuge(sichtbar: boolean): void
}

const WERKZEUGLEISTE: L.PM.ToolbarOptions = {
  position: 'topleft',
  drawPolygon: true,
  drawRectangle: true,
  editMode: true,
  dragMode: true,
  removalMode: true,
  drawMarker: false,
  drawCircleMarker: false,
  drawPolyline: false,
  drawCircle: false,
  drawText: false,
  cutPolygon: false,
  rotateMode: false,
}

function richteZeichnenEin(karte: L.Map): void {
  karte.pm.setLang('de', MAKLERFREUNDLICHE_TEXTE)
  karte.pm.setGlobalOptions({
    allowSelfIntersection: false,
    pathOptions: { className: GRUNDSTUECK_KLASSE },
    templineStyle: { className: ZEICHENLINIE_KLASSE },
    hintlineStyle: { className: ZEICHENLINIE_KLASSE },
  })
}

function beendeAlleModi(karte: L.Map): void {
  karte.pm.disableDraw()
  karte.pm.disableGlobalEditMode()
  karte.pm.disableGlobalDragMode()
  karte.pm.disableGlobalRemovalMode()
}

export function aktiviereGrundstueckZeichnen(
  karte: L.Map,
  beiAenderung: (grundstueck: GrundstueckPolygon | null) => void,
): GrundstueckZeichnen {
  let grundstueckFlaeche: L.Polygon | null = null

  function meldeAktuellesGrundstueck(): void {
    beiAenderung(grundstueckFlaeche ? (grundstueckFlaeche.toGeoJSON() as GrundstueckPolygon) : null)
  }

  function entferneGrundstueck(): void {
    grundstueckFlaeche?.remove()
    grundstueckFlaeche = null
  }

  function ersetzeGrundstueck(neueFlaeche: L.Layer): void {
    if (!(neueFlaeche instanceof L.Polygon)) return
    entferneGrundstueck()
    grundstueckFlaeche = neueFlaeche
    grundstueckFlaeche.on('pm:edit', meldeAktuellesGrundstueck)
    meldeAktuellesGrundstueck()
  }

  function vergissGeloeschteFlaeche(geloeschteFlaeche: L.Layer): void {
    if (geloeschteFlaeche !== grundstueckFlaeche) return
    grundstueckFlaeche = null
    meldeAktuellesGrundstueck()
  }

  function zeigeWerkzeuge(sichtbar: boolean): void {
    if (sichtbar) {
      karte.pm.addControls(WERKZEUGLEISTE)
      return
    }
    beendeAlleModi(karte)
    karte.pm.removeControls()
  }

  richteZeichnenEin(karte)
  karte.on('pm:create', ({ layer }) => ersetzeGrundstueck(layer))
  karte.on('pm:remove', ({ layer }) => vergissGeloeschteFlaeche(layer))

  return { entferneGrundstueck, zeigeWerkzeuge }
}
