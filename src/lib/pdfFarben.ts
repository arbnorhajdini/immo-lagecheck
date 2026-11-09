export interface PdfFarben {
  primaer: string
  primaerKontrast: string
  text: string
  textGedaempft: string
  rahmen: string
  flaeche: string
  grundstueckFuellung: string
  grundstueckRand: string
  strasse: string
  fehlendeKachel: string
}

const DESIGN_TOKENS: Record<keyof PdfFarben, string> = {
  primaer: '--pdf-primary',
  primaerKontrast: '--pdf-primary-contrast',
  text: '--pdf-text',
  textGedaempft: '--pdf-text-muted',
  rahmen: '--pdf-border',
  flaeche: '--pdf-surface',
  grundstueckFuellung: '--pdf-plot-fill',
  grundstueckRand: '--pdf-plot-stroke',
  strasse: '--pdf-road',
  fehlendeKachel: '--pdf-tile-missing',
}

function leseToken(stil: CSSStyleDeclaration, token: string): string {
  const wert = stil.getPropertyValue(token).trim()
  if (!wert) throw new Error(`Design-Token ${token} fehlt in tokens.css`)
  return wert
}

export function ladePdfFarben(element: Element = document.documentElement): PdfFarben {
  const stil = getComputedStyle(element)
  const eintraege = Object.entries(DESIGN_TOKENS).map(([name, token]) => [
    name,
    leseToken(stil, token),
  ])
  return Object.fromEntries(eintraege) as PdfFarben
}
