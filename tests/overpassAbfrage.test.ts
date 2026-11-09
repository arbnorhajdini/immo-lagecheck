import { describe, expect, it } from 'vitest'
import {
  baueOverpassAbfrage,
  enthaeltLaufzeitfehler,
  liegtInDeutschland,
  rundeMittelpunkt,
} from '@/lib/overpassAbfrage'

const WOLFSBURG = { lat: 52.41414, lon: 10.83708 }

describe('baueOverpassAbfrage', () => {
  const abfrage = baueOverpassAbfrage(WOLFSBURG)

  it('sucht im Umkreis von 1.500 m um den Mittelpunkt', () => {
    expect(abfrage).toContain('(around:1500,52.41414,10.83708)')
  })

  it('setzt ein Zeitlimit und fordert JSON an', () => {
    expect(abfrage).toMatch(/^\[out:json\]\[timeout:\d+\];/)
  })

  it('enthält alle Kategorien aus dem Lage-Check', () => {
    expect(abfrage).toContain('nwr["highway"~"^(bus_stop)$"]')
    expect(abfrage).toContain('nwr["railway"~"^(station|halt)$"]')
    expect(abfrage).toContain('nwr["shop"~"^(supermarket)$"]')
    expect(abfrage).toContain('nwr["amenity"~"^(school)$"]')
    expect(abfrage).toContain('nwr["amenity"~"^(kindergarten)$"]')
    expect(abfrage).toContain('nwr["amenity"~"^(pharmacy)$"]')
    expect(abfrage).toContain('nwr["amenity"~"^(doctors)$"]')
    expect(abfrage).toContain('way["highway"~"^(primary|secondary|trunk)$"]')
  })

  it('fordert für Orte den Mittelpunkt und für Straßen den Linienverlauf an', () => {
    expect(abfrage).toContain('out tags center;')
    expect(abfrage).toContain('out tags geom;')
  })
})

describe('rundeMittelpunkt', () => {
  it('rundet auf drei Nachkommastellen, damit gleiche Grundstücke dieselbe Anfrage ergeben', () => {
    expect(rundeMittelpunkt(WOLFSBURG)).toEqual({ lat: 52.414, lon: 10.837 })
  })
})

describe('liegtInDeutschland', () => {
  it('akzeptiert Orte in Deutschland', () => {
    expect(liegtInDeutschland(WOLFSBURG)).toBe(true)
    expect(liegtInDeutschland({ lat: 47.42, lon: 10.98 })).toBe(true)
  })

  it('lehnt Orte außerhalb ab', () => {
    expect(liegtInDeutschland({ lat: 48.8566, lon: 2.3522 })).toBe(false)
    expect(liegtInDeutschland({ lat: 0, lon: 0 })).toBe(false)
  })
})

describe('enthaeltLaufzeitfehler', () => {
  it('erkennt den Overpass-Hinweis auf einen abgebrochenen Lauf', () => {
    expect(enthaeltLaufzeitfehler('{"remark": "runtime error: Query timed out"}')).toBe(true)
    expect(enthaeltLaufzeitfehler('{"elements": []}')).toBe(false)
  })
})
