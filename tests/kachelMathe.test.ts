import { describe, expect, it } from 'vitest'
import {
  alsBildpunkt,
  alsWeltpixel,
  begrenzungUmKreis,
  begrenzungVon,
  benoetigteKacheln,
  berechneAusschnitt,
  erweitereBegrenzung,
  KACHEL_PX,
  passenderZoom,
  vereinigeBegrenzungen,
} from '@/lib/kachelMathe'

const WOLFSBURG = { lat: 52.41414, lon: 10.83708 }
const KLEINES_GRUNDSTUECK = { sued: 52.4141, west: 10.837, nord: 52.4142, ost: 10.8372 }

describe('alsWeltpixel', () => {
  it('legt den Schnittpunkt von Äquator und Nullmeridian in die Mitte der Welt', () => {
    expect(alsWeltpixel({ lat: 0, lon: 0 }, 0)).toEqual({ x: KACHEL_PX / 2, y: KACHEL_PX / 2 })
  })

  it('verdoppelt die Pixelkoordinaten mit jeder Zoomstufe', () => {
    const zoom10 = alsWeltpixel(WOLFSBURG, 10)
    const zoom11 = alsWeltpixel(WOLFSBURG, 11)

    expect(zoom11.x).toBeCloseTo(zoom10.x * 2, 6)
    expect(zoom11.y).toBeCloseTo(zoom10.y * 2, 6)
  })
})

describe('passenderZoom', () => {
  it('wählt für ein kleines Grundstück die höchste erlaubte Zoomstufe', () => {
    expect(passenderZoom(KLEINES_GRUNDSTUECK, 1424, 880, 19)).toBe(19)
  })

  it('zoomt für einen Umkreis von 1,5 km deutlich weiter heraus', () => {
    const zoom = passenderZoom(begrenzungUmKreis(WOLFSBURG, 1500), 1424, 880, 19)

    expect(zoom).toBeGreaterThanOrEqual(13)
    expect(zoom).toBeLessThanOrEqual(15)
  })
})

describe('berechneAusschnitt', () => {
  const ausschnitt = berechneAusschnitt(KLEINES_GRUNDSTUECK, 1424, 880, 19)

  it('legt den Ursprung auf ganze Pixel, damit keine Kachelfugen entstehen', () => {
    expect(Number.isInteger(ausschnitt.ursprung.x)).toBe(true)
    expect(Number.isInteger(ausschnitt.ursprung.y)).toBe(true)
  })

  it('zentriert die Begrenzung im Bild', () => {
    const mitte = alsBildpunkt({ lat: 52.41415, lon: 10.8371 }, ausschnitt)

    expect(mitte.x).toBeCloseTo(1424 / 2, 0)
    expect(mitte.y).toBeCloseTo(880 / 2, 0)
  })
})

describe('benoetigteKacheln', () => {
  it('deckt den ganzen Ausschnitt ohne Lücken ab', () => {
    const kacheln = benoetigteKacheln({
      zoom: 15,
      ursprung: { x: 100, y: 50 },
      breitePx: 600,
      hoehePx: 300,
    })
    const spalten = new Set(kacheln.map(({ x }) => x))
    const zeilen = new Set(kacheln.map(({ y }) => y))

    expect([...spalten]).toEqual([0, 1, 2])
    expect([...zeilen]).toEqual([0, 1])
    expect(kacheln[0]).toEqual({ x: 0, y: 0, zoom: 15, zielX: -100, zielY: -50 })
  })
})

describe('Begrenzungen', () => {
  it('ermittelt die Begrenzung einer Punktmenge', () => {
    expect(
      begrenzungVon([
        { lat: 1, lon: 5 },
        { lat: 3, lon: 2 },
      ]),
    ).toEqual({ sued: 1, west: 2, nord: 3, ost: 5 })
  })

  it('erweitert eine Begrenzung anteilig in alle Richtungen', () => {
    expect(erweitereBegrenzung({ sued: 0, west: 0, nord: 2, ost: 4 }, 0.5)).toEqual({
      sued: -1,
      west: -2,
      nord: 3,
      ost: 6,
    })
  })

  it('vereinigt zwei Begrenzungen zur umschließenden', () => {
    expect(
      vereinigeBegrenzungen(
        { sued: 0, west: 0, nord: 1, ost: 1 },
        { sued: -1, west: 0.5, nord: 0.5, ost: 3 },
      ),
    ).toEqual({ sued: -1, west: 0, nord: 1, ost: 3 })
  })

  it('macht einen Umkreis in Nord-Süd-Richtung rund 2 × Radius hoch', () => {
    const { sued, nord } = begrenzungUmKreis(WOLFSBURG, 1500)
    const meterProGradBreite = 111_320

    expect((nord - sued) * meterProGradBreite).toBeCloseTo(3000, -1)
  })
})
