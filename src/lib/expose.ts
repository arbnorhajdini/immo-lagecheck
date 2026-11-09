import { erstelleExposeInhalt } from '@/lib/exposeInhalt'
import { baueExposePdf } from '@/lib/exposePdf'
import { type Bezugsobjekt, type GrundstueckMasse, mittelpunktVon } from '@/lib/geometrie'
import { zeichneObjektkarte, zeichneUmgebungskarte } from '@/lib/kartenbild'
import type { Objektart } from '@/lib/objektart'
import { ladePdfFarben } from '@/lib/pdfFarben'
import type { AdressTreffer, UmgebungsAuswertung } from '@/types'

export interface ExposeAuftrag {
  objektart: Objektart
  adresse: AdressTreffer | null
  bezug: Bezugsobjekt
  masse: GrundstueckMasse | null
  auswertung: UmgebungsAuswertung | null
}

export async function speichereExposeAlsPdf({
  objektart,
  adresse,
  bezug,
  masse,
  auswertung,
}: ExposeAuftrag): Promise<string> {
  const farben = ladePdfFarben()
  const inhalt = erstelleExposeInhalt({
    objektart,
    adresse,
    masse,
    auswertung,
    mittelpunkt: mittelpunktVon(bezug),
    erstelltAm: Date.now(),
  })

  const [objektkarte, umgebungskarte] = await Promise.all([
    zeichneObjektkarte(bezug, farben),
    auswertung ? zeichneUmgebungskarte(bezug, auswertung, farben) : null,
  ])

  const pdf = await baueExposePdf(inhalt, { objekt: objektkarte, umgebung: umgebungskarte }, farben)
  pdf.save(inhalt.dateiname)
  return inhalt.dateiname
}
