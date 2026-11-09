import { erstelleExposeInhalt } from '@/lib/exposeInhalt'
import { baueExposePdf } from '@/lib/exposePdf'
import {
  berechneMittelpunkt,
  type GrundstueckMasse,
  type GrundstueckPolygon,
} from '@/lib/geometrie'
import { zeichneGrundstueckskarte, zeichneUmgebungskarte } from '@/lib/kartenbild'
import { ladePdfFarben } from '@/lib/pdfFarben'
import type { AdressTreffer, UmgebungsAuswertung } from '@/types'

export interface ExposeAuftrag {
  adresse: AdressTreffer | null
  grundstueck: GrundstueckPolygon
  masse: GrundstueckMasse
  auswertung: UmgebungsAuswertung | null
}

export async function speichereExposeAlsPdf({
  adresse,
  grundstueck,
  masse,
  auswertung,
}: ExposeAuftrag): Promise<string> {
  const farben = ladePdfFarben()
  const inhalt = erstelleExposeInhalt({
    adresse,
    masse,
    auswertung,
    mittelpunkt: berechneMittelpunkt(grundstueck),
    erstelltAm: Date.now(),
  })

  const [grundstueckskarte, umgebungskarte] = await Promise.all([
    zeichneGrundstueckskarte(grundstueck, farben),
    auswertung ? zeichneUmgebungskarte(grundstueck, auswertung, farben) : null,
  ])

  const pdf = await baueExposePdf(
    inhalt,
    { grundstueck: grundstueckskarte, umgebung: umgebungskarte },
    farben,
  )
  pdf.save(inhalt.dateiname)
  return inhalt.dateiname
}
