import { describe, expect, it } from 'vitest'
import type { Punkt } from '@/lib/kachelMathe'
import { verteileMarker } from '@/lib/markerVerteilung'

const MINDESTABSTAND = 50

function abstand(a: Punkt, b: Punkt): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

describe('verteileMarker', () => {
  it('lässt Marker mit genug Abstand an ihrer Position', () => {
    const wunsch = [
      { x: 100, y: 100 },
      { x: 300, y: 100 },
    ]

    expect(verteileMarker(wunsch, MINDESTABSTAND)).toEqual(wunsch)
  })

  it('schiebt übereinanderliegende Marker auseinander', () => {
    const gleicherOrt = [
      { x: 200, y: 200 },
      { x: 200, y: 200 },
      { x: 205, y: 198 },
    ]

    const [erster, zweiter, dritter] = verteileMarker(gleicherOrt, MINDESTABSTAND)

    expect(erster).toEqual({ x: 200, y: 200 })
    expect(abstand(erster!, zweiter!)).toBeGreaterThanOrEqual(MINDESTABSTAND)
    expect(abstand(erster!, dritter!)).toBeGreaterThanOrEqual(MINDESTABSTAND)
    expect(abstand(zweiter!, dritter!)).toBeGreaterThanOrEqual(MINDESTABSTAND)
  })

  it('hält Abstand zu bereits belegten Punkten wie dem Grundstück', () => {
    const grundstueck = { x: 400, y: 400 }

    const [marker] = verteileMarker([{ x: 410, y: 400 }], MINDESTABSTAND, [grundstueck])

    expect(abstand(marker!, grundstueck)).toBeGreaterThanOrEqual(MINDESTABSTAND)
  })
})
