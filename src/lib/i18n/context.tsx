"use client"
import { createContext, useState, useCallback, useEffect, useMemo } from "react"
import type { Locale, TranslationKeys } from "./types"
import zh from "./locales/zh.json"
import ja from "./locales/ja.json"
import ko from "./locales/ko.json"
import vi from "./locales/vi.json"

const translations: Record<Locale, TranslationKeys> = { zh, ja, ko, vi }

export interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationKeys
}

export const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh")

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== "undefined") {
      localStorage.setItem("fengshuiming-locale", newLocale)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fengshuiming-locale")
      if (stored && stored in translations) {
        setLocaleState(stored as Locale)
      }
    }
  }, [])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: translations[locale],
    }),
    [locale, setLocale]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
