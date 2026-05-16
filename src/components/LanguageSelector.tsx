"use client"
import { useState } from "react"
import { useTranslation } from "@/lib/i18n/hooks"
import type { Locale } from "@/lib/i18n/types"

interface LanguageOption {
  locale: Locale
  label: string
  nativeName: string
}

const languages: LanguageOption[] = [
  { locale: "zh", label: "Chinese", nativeName: "中文" },
  { locale: "vi", label: "Vietnamese", nativeName: "Tiếng Việt" },
]

export function LanguageSelector() {
  const { locale, setLocale } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const currentLang = languages.find((l) => l.locale === locale)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-sm font-medium text-gray-700"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="text-lg">{currentLang?.nativeName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-purple-100 py-2 z-50 animate-scale-in"
          role="listbox"
          aria-label="Language options"
        >
          {languages.map((lang) => (
            <button
              key={lang.locale}
              onClick={() => {
                setLocale(lang.locale)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                locale === lang.locale
                  ? "bg-purple-100 text-purple-700 font-medium"
                  : "text-gray-700 hover:bg-purple-50"
              }`}
              role="option"
              aria-selected={locale === lang.locale}
            >
              <span className="text-lg mr-2">{lang.nativeName}</span>
              <span className="text-gray-500 text-xs">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
