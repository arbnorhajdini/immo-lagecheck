import type { Punkt } from '@/lib/kachelMathe'

const RICHTUNGEN = 12
const MAX_RINGE = 4

function abstand(a: Punkt, b: Punkt): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function istFrei(kandidat: Punkt, belegt: Punkt[], mindestabstand: number): boolean {
  return belegt.every((punkt) => abstand(kandidat, punkt) >= mindestabstand)
}

function ausweichpositionen(ursprung: Punkt, mindestabstand: number): Punkt[] {
  const positionen: Punkt[] = []
  for (let ring = 1; ring <= MAX_RINGE; ring++) {
    for (let richtung = 0; richtung < RICHTUNGEN; richtung++) {
      const winkel = (2 * Math.PI * richtung) / RICHTUNGEN - Math.PI / 2
      positionen.push({
        x: ursprung.x + Math.cos(winkel) * mindestabstand * ring,
        y: ursprung.y + Math.sin(winkel) * mindestabstand * ring,
      })
    }
  }
  return positionen
}

export function verteileMarker(
  wunschpositionen: Punkt[],
  mindestabstand: number,
  bereitsBelegt: Punkt[] = [],
): Punkt[] {
  const belegt = [...bereitsBelegt]
  return wunschpositionen.map((wunsch) => {
    const position =
      [wunsch, ...ausweichpositionen(wunsch, mindestabstand)].find((kandidat) =>
        istFrei(kandidat, belegt, mindestabstand),
      ) ?? wunsch
    belegt.push(position)
    return position
  })
}
