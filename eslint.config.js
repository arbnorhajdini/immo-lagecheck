import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import { globalIgnores } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import { keineKommentare } from './eslint-regeln/keine-kommentare.js'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue,js,mjs}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '.vercel/**']),

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  {
    name: 'app/clean-code',
    plugins: { app: { rules: { 'keine-kommentare': keineKommentare } } },
    rules: {
      'app/keine-kommentare': 'error',
      'no-irregular-whitespace': ['error', { skipStrings: false, skipTemplates: false }],
    },
  },

  {
    name: 'app/node-scripts',
    files: [
      'scripts/**/*.mjs',
      'eslint-regeln/**/*.js',
      '*.config.{js,ts}',
      'vite/**/*.ts',
      'api/**/*.ts',
    ],
    languageOptions: { globals: globals.node },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['tests/**/*'],
  },

  skipFormatting,
)
