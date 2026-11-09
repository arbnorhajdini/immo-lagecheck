type JsPdfModul = typeof import('jspdf')

const MODUL_LADEFEHLER =
  /dynamically imported module|Importing a module script failed|error loading dynamically/i

let ladevorgang: Promise<JsPdfModul> | null = null

export function ladeJsPdf(): Promise<JsPdfModul> {
  ladevorgang ??= import('jspdf').catch((fehler: unknown) => {
    ladevorgang = null
    throw fehler
  })
  return ladevorgang
}

export function ladeJsPdfImVoraus(): Promise<boolean> {
  return ladeJsPdf().then(
    () => true,
    () => false,
  )
}

export function istModulLadefehler(fehler: unknown): boolean {
  return fehler instanceof TypeError && MODUL_LADEFEHLER.test(fehler.message)
}
