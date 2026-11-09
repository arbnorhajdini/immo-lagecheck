export function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return typeof wert === 'object' && wert !== null
}

export function alsZahl(wert: unknown): number | null {
  const zahl = typeof wert === 'number' ? wert : Number.parseFloat(String(wert))
  return Number.isFinite(zahl) ? zahl : null
}
