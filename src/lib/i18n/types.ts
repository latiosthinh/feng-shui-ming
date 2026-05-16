export type Locale = 'zh' | 'ja' | 'ko' | 'vi'

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
    exportFavorites: string
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
    randomGenerate: string
    advancedSettings: string
    nameCount: string
    familyMembers: string
    addMember: string
    remove: string
    member: string
    namePlaceholder: string
    selectAll: string
    deselectAll: string
    father: string
    mother: string
    brother: string
    sister: string
    grandfather: string
    grandmother: string
    other: string
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
    generating: string
    generatingNames: string
    nameResults: string
    maxFavorites: string
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
  analysis: {
    fengshui: string
    numerology: string
    bazi: string
    horoscope: string
    analyzing: string
    clickToStart: string
    detail: string
    failed: string
  }
  nameCard: {
    fengshui: string
    numerology: string
    bazi: string
    horoscope: string
    excellent: string
    good: string
    fair: string
    poor: string
  }
  streamStatus: {
    thinking: string
    thinkingSeeded: string
    arriving: string
    polishing: string
  }
}
