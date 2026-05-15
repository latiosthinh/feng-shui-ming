export type Locale = "zh" | "ja" | "ko" | "vi"

export interface TranslationKeys {
  common: {
    appName: string
    generate: string
    regenerate: string
    loading: string
    error: string
    favorites: string
    noFavorites: string
    removeFavorite: string
  }
  form: {
    title: string
    surname: string
    optional: string
    surnamePlaceholder: string
    gender: string
    male: string
    female: string
    neutral: string
    birthDate: string
    birthTime: string
    preferences: string
    submit: string
    nature: string
    virtue: string
    strength: string
    wisdom: string
    beauty: string
    peace: string
  }
  results: {
    meaning: string
    fengShui: string
    nickname: string
    fiveGrid: string
    wuXing: string
    tianGe: string
    renGe: string
    diGe: string
    waiGe: string
    zongGe: string
    auspicious: string
    neutral: string
    inauspicious: string
    recommendations: string
    thinking: string
    analysisComplete: string
    error: string
  }
  validation: {
    surnameRequired: string
    surnameTooLong: string
    surnameInvalid: string
    genderRequired: string
    birthDateInvalid: string
    birthTimeInvalid: string
    preferencesMax: string
  }
}
