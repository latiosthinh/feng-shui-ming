'use client'

import { useTranslation } from '@/lib/i18n/hooks'

interface RandomButtonProps {
  onClick: () => void
  isLoading: boolean
}

export function RandomButton({ onClick, isLoading }: RandomButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all disabled:opacity-50 text-sm font-medium"
    >
      {isLoading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      )}
      {t.form.randomGenerate}
    </button>
  )
}
