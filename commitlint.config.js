const REGEL_AUS = 0

const DEUTSCHE_BESCHREIBUNGEN_DUERFEN_MIT_NOMEN_BEGINNEN = {
  'subject-case': [REGEL_AUS],
}

export default {
  extends: ['@commitlint/config-conventional'],
  rules: { ...DEUTSCHE_BESCHREIBUNGEN_DUERFEN_MIT_NOMEN_BEGINNEN },
}
