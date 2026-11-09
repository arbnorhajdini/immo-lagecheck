const ERSATZZEICHEN = '?'
const WIN_ANSI_SONDERZEICHEN = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')
const DRUCKBARES_ASCII = { von: 0x20, bis: 0x7e }
const LATIN_1 = { von: 0xa0, bis: 0xff }

function liegtIn(code: number, { von, bis }: { von: number; bis: number }): boolean {
  return code >= von && code <= bis
}

function istWinAnsi(zeichen: string): boolean {
  const code = zeichen.codePointAt(0) ?? 0
  return (
    liegtIn(code, DRUCKBARES_ASCII) || liegtIn(code, LATIN_1) || WIN_ANSI_SONDERZEICHEN.has(zeichen)
  )
}

function ohneAkzent(zeichen: string): string {
  return Array.from(zeichen.normalize('NFKD')).filter(istWinAnsi).join('')
}

export function alsPdfText(text: string): string {
  return Array.from(text, (zeichen) =>
    istWinAnsi(zeichen) ? zeichen : ohneAkzent(zeichen) || ERSATZZEICHEN,
  ).join('')
}
