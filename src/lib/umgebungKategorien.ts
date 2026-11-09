import type { KategorieSchluessel, Ortsgeometrie } from '@/types'

export const UMKREIS_M = 1500

export type OsmTags = Record<string, string | undefined>

interface TagBedingung {
  schluessel: string
  werte: string[]
}

export interface UmgebungsKategorie {
  schluessel: KategorieSchluessel
  bezeichnung: string
  symbol: string
  bedingung: TagBedingung
  geometrieArt: Ortsgeometrie['art']
}

export const UMGEBUNGS_KATEGORIEN: UmgebungsKategorie[] = [
  {
    schluessel: 'bushaltestelle',
    bezeichnung: 'Bushaltestelle',
    symbol: '🚌',
    bedingung: { schluessel: 'highway', werte: ['bus_stop'] },
    geometrieArt: 'punkt',
  },
  {
    schluessel: 'bahnhof',
    bezeichnung: 'Bahnhof/Haltepunkt',
    symbol: '🚆',
    bedingung: { schluessel: 'railway', werte: ['station', 'halt'] },
    geometrieArt: 'punkt',
  },
  {
    schluessel: 'supermarkt',
    bezeichnung: 'Supermarkt',
    symbol: '🛒',
    bedingung: { schluessel: 'shop', werte: ['supermarket'] },
    geometrieArt: 'punkt',
  },
  {
    schluessel: 'schule',
    bezeichnung: 'Schule',
    symbol: '🏫',
    bedingung: { schluessel: 'amenity', werte: ['school'] },
    geometrieArt: 'punkt',
  },
  {
    schluessel: 'kita',
    bezeichnung: 'Kita',
    symbol: '🧸',
    bedingung: { schluessel: 'amenity', werte: ['kindergarten'] },
    geometrieArt: 'punkt',
  },
  {
    schluessel: 'apotheke',
    bezeichnung: 'Apotheke',
    symbol: '💊',
    bedingung: { schluessel: 'amenity', werte: ['pharmacy'] },
    geometrieArt: 'punkt',
  },
  {
    schluessel: 'arztpraxis',
    bezeichnung: 'Arztpraxis',
    symbol: '🩺',
    bedingung: { schluessel: 'amenity', werte: ['doctors'] },
    geometrieArt: 'punkt',
  },
  {
    schluessel: 'hauptstrasse',
    bezeichnung: 'Hauptstraße',
    symbol: '🛣️',
    bedingung: { schluessel: 'highway', werte: ['primary', 'secondary', 'trunk'] },
    geometrieArt: 'linie',
  },
]

export function alsOverpassFilter({ schluessel, werte }: TagBedingung): string {
  return `["${schluessel}"~"^(${werte.join('|')})$"]`
}

export function passtZuKategorie(tags: OsmTags, { bedingung }: UmgebungsKategorie): boolean {
  const wert = tags[bedingung.schluessel]
  return wert !== undefined && bedingung.werte.includes(wert)
}

export function findeKategorie(tags: OsmTags): UmgebungsKategorie | undefined {
  return UMGEBUNGS_KATEGORIEN.find((kategorie) => passtZuKategorie(tags, kategorie))
}
