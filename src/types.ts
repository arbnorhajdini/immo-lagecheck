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
