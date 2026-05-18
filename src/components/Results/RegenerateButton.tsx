'use client'
import { useTranslation } from '@/lib/i18n/hooks'

interface RegenerateButtonProps {
  onRegenerate: () => void
  isLoading: boolean
}

export function RegenerateButton({ onRegenerate, isLoading }: RegenerateButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      onClick={onRegenerate}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors text-sm font-medium disabled:opacity-50 cursor-pointer"
    >
      <svg
        className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {t.common.regenerate}
    </button>
  )
}
