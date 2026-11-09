import { computed, readonly, ref, watchEffect } from 'vue'
import { mitLocalStorage } from '@/lib/speicher'

export type ThemeModus = 'light' | 'dark' | 'system'
export type Theme = 'light' | 'dark'

const THEME_SPEICHERSCHLUESSEL = import.meta.env.VITE_THEME_STORAGE_KEY
const SYSTEM_BEVORZUGT_DUNKEL_QUERY = '(prefers-color-scheme: dark)'

export function istThemeModus(wert: unknown): wert is ThemeModus {
  return wert === 'light' || wert === 'dark' || wert === 'system'
}

export function ermittleTheme(modus: ThemeModus, systemBevorzugtDunkel: boolean): Theme {
  if (modus === 'system') return systemBevorzugtDunkel ? 'dark' : 'light'
  return modus
}

function ladeGespeichertenModus(): ThemeModus {
  const gespeichert = mitLocalStorage(
    (speicher) => speicher.getItem(THEME_SPEICHERSCHLUESSEL),
    null,
  )
  return istThemeModus(gespeichert) ? gespeichert : 'system'
}

function speichereModus(modus: ThemeModus): void {
  mitLocalStorage((speicher) => {
    if (modus === 'system') speicher.removeItem(THEME_SPEICHERSCHLUESSEL)
    else speicher.setItem(THEME_SPEICHERSCHLUESSEL, modus)
  }, undefined)
}

const gewaehlterModus = ref<ThemeModus>('system')
const systemBevorzugtDunkel = ref(false)
const aktivesTheme = computed(() =>
  ermittleTheme(gewaehlterModus.value, systemBevorzugtDunkel.value),
)
let istInitialisiert = false

function beobachteSystemeinstellung(): void {
  const mediaQuery = window.matchMedia(SYSTEM_BEVORZUGT_DUNKEL_QUERY)
  systemBevorzugtDunkel.value = mediaQuery.matches
  mediaQuery.addEventListener('change', (aenderung) => {
    systemBevorzugtDunkel.value = aenderung.matches
  })
}

function wendeThemeAufDokumentAn(): void {
  watchEffect(() => {
    document.documentElement.classList.toggle('dark', aktivesTheme.value === 'dark')
  })
}

function initialisiereEinmalig(): void {
  if (istInitialisiert) return
  istInitialisiert = true
  gewaehlterModus.value = ladeGespeichertenModus()
  beobachteSystemeinstellung()
  wendeThemeAufDokumentAn()
}

export function useTheme() {
  initialisiereEinmalig()

  function setzeModus(modus: ThemeModus): void {
    gewaehlterModus.value = modus
    speichereModus(modus)
  }

  return {
    gewaehlterModus: readonly(gewaehlterModus),
    aktivesTheme,
    istDunkel: computed(() => aktivesTheme.value === 'dark'),
    setzeModus,
  }
}
