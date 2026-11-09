import { abstandZumBezugM, type Bezugsobjekt } from '@/lib/geometrie'
import { UMGEBUNGS_KATEGORIEN } from '@/lib/umgebungKategorien'
import type { KategorieErgebnis, NaechsterOrt, UmgebungsOrt } from '@/types'

function naechsterOrt(bezug: Bezugsobjekt, kandidaten: UmgebungsOrt[]): NaechsterOrt | null {
  return kandidaten
    .map((ort) => ({ ort, abstandM: abstandZumBezugM(bezug, ort.geometrie) }))
    .reduce<NaechsterOrt | null>(
      (bisherNaechster, kandidat) =>
        !bisherNaechster || kandidat.abstandM < bisherNaechster.abstandM
          ? kandidat
          : bisherNaechster,
      null,
    )
}

export function ermittleNaechsteOrte(
  bezug: Bezugsobjekt,
  orte: UmgebungsOrt[],
): KategorieErgebnis[] {
  return UMGEBUNGS_KATEGORIEN.map(({ schluessel, bezeichnung, symbol }) => ({
    kategorie: schluessel,
    bezeichnung,
    symbol,
    naechsterOrt: naechsterOrt(
      bezug,
      orte.filter((ort) => ort.kategorie === schluessel),
    ),
  }))
}

export interface NummerierterOrt {
  nummer: number
  ergebnis: KategorieErgebnis
  naechsterOrt: NaechsterOrt
}

export function nummeriereGefundeneOrte(ergebnisse: KategorieErgebnis[]): NummerierterOrt[] {
  return ergebnisse
    .flatMap((ergebnis) =>
      ergebnis.naechsterOrt ? [{ ergebnis, naechsterOrt: ergebnis.naechsterOrt }] : [],
    )
    .map((gefunden, index) => ({ ...gefunden, nummer: index + 1 }))
}
