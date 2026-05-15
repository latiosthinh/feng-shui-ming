"use client"
import { useTranslation } from "@/lib/i18n/hooks"

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
      <div className="text-4xl">⚠️</div>
      <h3 className="text-lg font-semibold text-red-700">{t.results.error}</h3>
      <p className="text-red-600 text-sm">{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
      >
        {t.common.regenerate}
      </button>
    </div>
  )
}
