import { abstandZumGrundstueckM, type GrundstueckPolygon } from '@/lib/geometrie'
import { UMGEBUNGS_KATEGORIEN } from '@/lib/umgebungKategorien'
import type { KategorieErgebnis, NaechsterOrt, UmgebungsOrt } from '@/types'

function naechsterOrt(
  grundstueck: GrundstueckPolygon,
  kandidaten: UmgebungsOrt[],
): NaechsterOrt | null {
  return kandidaten
    .map((ort) => ({ ort, abstandM: abstandZumGrundstueckM(grundstueck, ort.geometrie) }))
    .reduce<NaechsterOrt | null>(
      (bisherNaechster, kandidat) =>
        !bisherNaechster || kandidat.abstandM < bisherNaechster.abstandM
          ? kandidat
          : bisherNaechster,
      null,
    )
}

export function ermittleNaechsteOrte(
  grundstueck: GrundstueckPolygon,
  orte: UmgebungsOrt[],
): KategorieErgebnis[] {
  return UMGEBUNGS_KATEGORIEN.map(({ schluessel, bezeichnung, symbol }) => ({
    kategorie: schluessel,
    bezeichnung,
    symbol,
    naechsterOrt: naechsterOrt(
      grundstueck,
      orte.filter((ort) => ort.kategorie === schluessel),
    ),
  }))
}
