export interface Begrenzung {
  sued: number
  west: number
  nord: number
  ost: number
}

export interface AdressTreffer {
  id: number
  kurzName: string
  vollName: string
  lat: number
  lon: number
  begrenzung: Begrenzung | null
}

export interface Koordinate {
  lat: number
  lon: number
}

export type Ortsgeometrie =
  { art: 'punkt'; position: Koordinate } | { art: 'linie'; verlauf: Koordinate[] }

export type KategorieSchluessel =
  | 'bushaltestelle'
  | 'bahnhof'
  | 'supermarkt'
  | 'schule'
  | 'kita'
  | 'apotheke'
  | 'arztpraxis'
  | 'hauptstrasse'

export interface UmgebungsOrt {
  id: string
  kategorie: KategorieSchluessel
  name: string
  geometrie: Ortsgeometrie
}

export interface NaechsterOrt {
  ort: UmgebungsOrt
  abstandM: number
}

export interface KategorieErgebnis {
  kategorie: KategorieSchluessel
  bezeichnung: string
  symbol: string
  naechsterOrt: NaechsterOrt | null
}

export interface UmgebungsAuswertung {
  mittelpunkt: Koordinate
  umkreisM: number
  ergebnisse: KategorieErgebnis[]
}
