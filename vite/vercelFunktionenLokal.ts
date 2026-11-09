import type { IncomingMessage, ServerResponse } from 'node:http'
import { fileURLToPath } from 'node:url'
import { type Plugin, runnerImport } from 'vite'

interface VercelFunktion {
  GET(anfrage: Request): Promise<Response>
}

const FUNKTIONEN: Record<string, string> = {
  '/api/umgebung': fileURLToPath(new URL('../api/umgebung.ts', import.meta.url)),
}
const LOKALER_URSPRUNG = 'http://localhost'

async function ladeFunktion(datei: string): Promise<VercelFunktion> {
  const { module } = await runnerImport<VercelFunktion>(datei, { configFile: false })
  return module
}

async function beantworte(datei: string, anfrage: IncomingMessage, antwort: ServerResponse) {
  const { GET } = await ladeFunktion(datei)
  const ergebnis = await GET(new Request(new URL(anfrage.url ?? '/', LOKALER_URSPRUNG)))
  antwort.statusCode = ergebnis.status
  ergebnis.headers.forEach((wert, name) => antwort.setHeader(name, wert))
  antwort.end(Buffer.from(await ergebnis.arrayBuffer()))
}

function leiteWeiter(anfrage: IncomingMessage, antwort: ServerResponse, weiter: () => void) {
  const pfad = new URL(anfrage.url ?? '/', LOKALER_URSPRUNG).pathname
  const datei = FUNKTIONEN[pfad]
  if (!datei) return weiter()
  beantworte(datei, anfrage, antwort).catch(weiter)
}

export function vercelFunktionenLokal(): Plugin {
  return {
    name: 'vercel-funktionen-lokal',
    configureServer(server) {
      server.middlewares.use(leiteWeiter)
    },
    configurePreviewServer(server) {
      server.middlewares.use(leiteWeiter)
    },
  }
}
