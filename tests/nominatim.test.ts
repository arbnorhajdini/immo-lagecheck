import { describe, expect, it } from 'vitest'
import {
  baueRueckwaertsUrl,
  baueSuchUrl,
  erstelleRateLimiter,
  formatiereKurzName,
  parseRueckwaertsAntwort,
  parseSuchantwort,
} from '@/lib/nominatim'

describe('baueSuchUrl', () => {
  it('setzt alle Pflichtparameter und kodiert die Eingabe', () => {
    const url = new URL(baueSuchUrl('  Marienplatz 1, München  '))

    expect(url.origin + url.pathname).toBe('https://nominatim.openstreetmap.org/search')
    expect(url.searchParams.get('q')).toBe('Marienplatz 1, München')
    expect(url.searchParams.get('countrycodes')).toBe('de')
    expect(url.searchParams.get('accept-language')).toBe('de')
    expect(url.searchParams.get('format')).toBe('jsonv2')
    expect(url.searchParams.get('addressdetails')).toBe('1')
    expect(url.searchParams.get('limit')).toBe('10')
  })
})

describe('formatiereKurzName', () => {
  it('baut „Straße Nr, PLZ Ort“', () => {
    const adresse = { road: 'Marienplatz', house_number: '1', postcode: '80331', city: 'München' }

    expect(formatiereKurzName(adresse, 'x')).toBe('Marienplatz 1, 80331 München')
  })

  it('nimmt town/village, wenn city fehlt', () => {
    const adresse = { road: 'Hauptstraße', postcode: '33178', town: 'Borchen' }

    expect(formatiereKurzName(adresse, 'x')).toBe('Hauptstraße, 33178 Borchen')
  })

  it('fällt auf den Ersatznamen zurück', () => {
    expect(formatiereKurzName(undefined, 'Paderborn, NRW')).toBe('Paderborn, NRW')
    expect(formatiereKurzName({}, 'Paderborn, NRW')).toBe('Paderborn, NRW')
  })
})

describe('parseSuchantwort', () => {
  const nominatimEintrag = {
    place_id: 127722801,
    lat: '48.1374990',
    lon: '11.5747545',
    display_name: 'Thomass-Eck, 1, Marienplatz, München, Bayern, 80331, Deutschland',
    address: { road: 'Marienplatz', house_number: '1', postcode: '80331', city: 'München' },
    boundingbox: ['48.1373294', '48.1376477', '11.5745608', '11.5749313'],
  }

  it('wandelt einen Nominatim-Eintrag in einen Treffer um', () => {
    expect(parseSuchantwort([nominatimEintrag])).toEqual([
      {
        id: 127722801,
        kurzName: 'Marienplatz 1, 80331 München',
        vollName: nominatimEintrag.display_name,
        lat: 48.137499,
        lon: 11.5747545,
        begrenzung: { sued: 48.1373294, west: 11.5745608, nord: 48.1376477, ost: 11.5749313 },
      },
    ])
  })

  it('ignoriert ungültige Einträge und Antworten ohne Liste', () => {
    const ungueltigeEintraege = [
      null,
      { ...nominatimEintrag, lat: 'abc' },
      { ...nominatimEintrag, display_name: '' },
    ]

    expect(parseSuchantwort(null)).toEqual([])
    expect(parseSuchantwort({ error: 'x' })).toEqual([])
    expect(parseSuchantwort(ungueltigeEintraege)).toEqual([])
  })

  it('fasst Orte mit derselben Adresse zusammen und begrenzt auf 5 Treffer', () => {
    const cafeAnDerselbenAdresse = { ...nominatimEintrag, place_id: 2 }
    const sechsAndereHausnummern = Array.from({ length: 6 }, (_, index) => ({
      ...nominatimEintrag,
      place_id: 10 + index,
      address: { ...nominatimEintrag.address, house_number: String(index + 2) },
    }))

    const treffer = parseSuchantwort([
      nominatimEintrag,
      cafeAnDerselbenAdresse,
      ...sechsAndereHausnummern,
    ])

    expect(treffer.map(({ id }) => id)).toEqual([127722801, 10, 11, 12, 13])
  })

  it('setzt die Begrenzung auf null, wenn die Boundingbox fehlt oder unvollständig ist', () => {
    const [ohneBoundingbox] = parseSuchantwort([{ ...nominatimEintrag, boundingbox: undefined }])
    const [unvollstaendig] = parseSuchantwort([{ ...nominatimEintrag, boundingbox: ['1', '2'] }])

    expect(ohneBoundingbox?.begrenzung).toBeNull()
    expect(unvollstaendig?.begrenzung).toBeNull()
  })
})

describe('erstelleRateLimiter', () => {
  function erstelleTestLimiter(startzeit: number) {
    const uhr = { jetzt: startzeit }
    const gewarteteMillisekunden: number[] = []
    const warteAufFreienZeitpunkt = erstelleRateLimiter(
      1000,
      () => uhr.jetzt,
      async (millisekunden) => {
        gewarteteMillisekunden.push(millisekunden)
      },
    )
    return { uhr, gewarteteMillisekunden, warteAufFreienZeitpunkt }
  }

  it('wartet nur so lange, bis seit der letzten Anfrage 1 Sekunde vergangen ist', async () => {
    const { uhr, gewarteteMillisekunden, warteAufFreienZeitpunkt } = erstelleTestLimiter(10_000)

    await warteAufFreienZeitpunkt()
    uhr.jetzt += 2000
    await warteAufFreienZeitpunkt()
    uhr.jetzt += 300
    await warteAufFreienZeitpunkt()

    expect(gewarteteMillisekunden).toEqual([700])
  })

  it('reiht gleichzeitige Anfragen im Sekundentakt ein', async () => {
    const { gewarteteMillisekunden, warteAufFreienZeitpunkt } = erstelleTestLimiter(0)

    await Promise.all([
      warteAufFreienZeitpunkt(),
      warteAufFreienZeitpunkt(),
      warteAufFreienZeitpunkt(),
    ])

    expect(gewarteteMillisekunden).toEqual([1000, 2000])
  })
})

describe('Rückwärtssuche', () => {
  it('fragt die Adresse zu einer Koordinate auf Gebäudeebene und auf Deutsch an', () => {
    const url = new URL(baueRueckwaertsUrl({ lat: 52.4205, lon: 10.7865 }))

    expect(url.origin + url.pathname).toBe('https://nominatim.openstreetmap.org/reverse')
    expect(url.searchParams.get('lat')).toBe('52.4205')
    expect(url.searchParams.get('lon')).toBe('10.7865')
    expect(url.searchParams.get('zoom')).toBe('18')
    expect(url.searchParams.get('accept-language')).toBe('de')
  })

  it('macht aus der Antwort einen Adresstreffer', () => {
    const treffer = parseRueckwaertsAntwort({
      place_id: 7,
      lat: '52.4205',
      lon: '10.7865',
      display_name: 'Porschestraße, Köhlerberg, Wolfsburg, 38440, Deutschland',
      address: { road: 'Porschestraße', postcode: '38440', city: 'Wolfsburg' },
    })

    expect(treffer?.kurzName).toBe('Porschestraße, 38440 Wolfsburg')
  })

  it('liefert null, wenn Nominatim an der Stelle nichts findet', () => {
    expect(parseRueckwaertsAntwort({ error: 'Unable to geocode' })).toBeNull()
  })
})
