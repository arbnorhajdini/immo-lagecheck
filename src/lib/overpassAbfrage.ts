import type { Begrenzung, Koordinate, Ortsgeometrie } from '../types.js'
import {
  alsOverpassFilter,
  UMGEBUNGS_KATEGORIEN,
  UMKREIS_M,
  type UmgebungsKategorie,
} from './umgebungKategorien.js'

export const OVERPASS_ZEITLIMIT_S = 25
const NACHKOMMASTELLEN_MITTELPUNKT = 3

export const DEUTSCHLAND: Begrenzung = { sued: 47.2, west: 5.8, nord: 55.1, ost: 15.1 }

export function rundeMittelpunkt({ lat, lon }: Koordinate): Koordinate {
  const faktor = 10 ** NACHKOMMASTELLEN_MITTELPUNKT
  return { lat: Math.round(lat * faktor) / faktor, lon: Math.round(lon * faktor) / faktor }
}

export function liegtInDeutschland({ lat, lon }: Koordinate): boolean {
  return (
    lat >= DEUTSCHLAND.sued &&
    lat <= DEUTSCHLAND.nord &&
    lon >= DEUTSCHLAND.west &&
    lon <= DEUTSCHLAND.ost
  )
}

function kategorienMitGeometrie(art: Ortsgeometrie['art']): UmgebungsKategorie[] {
  return UMGEBUNGS_KATEGORIEN.filter((kategorie) => kategorie.geometrieArt === art)
}

export function baueOverpassAbfrage(mittelpunkt: Koordinate, umkreisM = UMKREIS_M): string {
  const umkreis = `(around:${umkreisM},${mittelpunkt.lat},${mittelpunkt.lon})`
  const ortsabfragen = kategorienMitGeometrie('punkt')
    .map(({ bedingung }) => `nwr${alsOverpassFilter(bedingung)}${umkreis};`)
    .join('')
  const linienabfragen = kategorienMitGeometrie('linie')
    .map(({ bedingung }) => `way${alsOverpassFilter(bedingung)}${umkreis};`)
    .join('')

  return [
    `[out:json][timeout:${OVERPASS_ZEITLIMIT_S}];`,
    `(${ortsabfragen});out tags center;`,
    `(${linienabfragen});out tags geom;`,
  ].join('')
}

export function enthaeltLaufzeitfehler(antwortText: string): boolean {
  return antwortText.includes('"remark"') && antwortText.includes('runtime error')
}
