const QM_PRO_HEKTAR = 10_000
const METER_PRO_KILOMETER = 1000
const ZAHL_UND_EINHEIT_TRENNER = '\u00a0'

const ganzeZahl = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 })
const zahlMitEinerNachkommastelle = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const zahlMitZweiNachkommastellen = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const deutschesDatum = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatiereDatum(zeitstempel: number): string {
  return deutschesDatum.format(zeitstempel)
}

function mitEinheit(zahl: string, einheit: string): string {
  return `${zahl}${ZAHL_UND_EINHEIT_TRENNER}${einheit}`
}

export function formatiereQuadratmeter(flaecheQm: number): string {
  return mitEinheit(ganzeZahl.format(flaecheQm), 'm²')
}

export function formatiereHektar(flaecheQm: number): string {
  return mitEinheit(zahlMitZweiNachkommastellen.format(flaecheQm / QM_PRO_HEKTAR), 'ha')
}

export function istHektarRelevant(flaecheQm: number): boolean {
  return Math.round(flaecheQm) >= QM_PRO_HEKTAR
}

export function formatiereFlaeche(flaecheQm: number): string {
  const inQuadratmetern = formatiereQuadratmeter(flaecheQm)
  return istHektarRelevant(flaecheQm)
    ? `${inQuadratmetern} (${formatiereHektar(flaecheQm)})`
    : inQuadratmetern
}

export function formatiereIsoDatum(zeitstempel: number): string {
  const datum = new Date(zeitstempel)
  return [datum.getFullYear(), datum.getMonth() + 1, datum.getDate()]
    .map((teil) => String(teil).padStart(2, '0'))
    .join('-')
}

export function formatiereLaenge(laengeM: number): string {
  if (Math.round(laengeM) < METER_PRO_KILOMETER) {
    return mitEinheit(ganzeZahl.format(laengeM), 'm')
  }
  return mitEinheit(zahlMitEinerNachkommastelle.format(laengeM / METER_PRO_KILOMETER), 'km')
}
