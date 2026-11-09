import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { vercelFunktionenLokal } from './vite/vercelFunktionenLokal'

const BUNDLE_MIT_LEAFLET_UND_GEOMAN_KB = 600

export default defineConfig({
  plugins: [vue(), tailwindcss(), vercelFunktionenLokal()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: BUNDLE_MIT_LEAFLET_UND_GEOMAN_KB,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
})
