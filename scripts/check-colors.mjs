import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

const PROJEKT_ORDNER = process.cwd()
const QUELL_ORDNER = resolve(PROJEKT_ORDNER, 'src')
const EINZIGE_DATEI_MIT_FARBWERTEN = resolve(QUELL_ORDNER, 'styles/tokens.css')
const GEPRUEFTE_DATEIENDUNGEN = new Set(['.vue', '.ts', '.tsx', '.js', '.mjs', '.css', '.html'])

const FARBMUSTER = [
  { art: 'Hex-Farbe', muster: /(?<![\w&/-])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi },
  { art: 'Farbfunktion', muster: /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/gi },
]

function alleDateienIn(ordner) {
  return readdirSync(ordner).flatMap((eintrag) => {
    const pfad = join(ordner, eintrag)
    return statSync(pfad).isDirectory() ? alleDateienIn(pfad) : [pfad]
  })
}

function istZuPruefen(datei) {
  return (
    datei.startsWith(QUELL_ORDNER + '/') &&
    datei !== EINZIGE_DATEI_MIT_FARBWERTEN &&
    GEPRUEFTE_DATEIENDUNGEN.has(extname(datei))
  )
}

function zuPruefendeDateien(uebergebeneDateien) {
  const kandidaten =
    uebergebeneDateien.length > 0
      ? uebergebeneDateien.map((datei) => resolve(PROJEKT_ORDNER, datei))
      : alleDateienIn(QUELL_ORDNER)
  return kandidaten.filter(istZuPruefen)
}

function findeFarbwerte(datei) {
  const zeilen = readFileSync(datei, 'utf8').split('\n')
  return zeilen.flatMap((zeile, index) =>
    FARBMUSTER.flatMap(({ art, muster }) =>
      [...zeile.matchAll(muster)].map(
        ([fund]) => `${relative(PROJEKT_ORDNER, datei)}:${index + 1}  ${art} „${fund}“`,
      ),
    ),
  )
}

function meldeFundstellenUndBeende(fundstellen) {
  console.error('Feste Farbwerte gefunden – bitte Tokens aus src/styles/tokens.css verwenden:\n')
  console.error(fundstellen.map((fundstelle) => `  ${fundstelle}`).join('\n'))
  console.error(`\n${fundstellen.length} Fundstelle(n).`)
  process.exit(1)
}

const dateien = zuPruefendeDateien(process.argv.slice(2))
const fundstellen = dateien.flatMap(findeFarbwerte)

if (fundstellen.length > 0) meldeFundstellenUndBeende(fundstellen)

console.log(`lint:colors – ${dateien.length} Datei(en) geprüft, keine festen Farbwerte gefunden.`)
