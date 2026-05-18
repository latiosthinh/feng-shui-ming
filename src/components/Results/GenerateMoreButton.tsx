'use client'
import { useTranslation } from '@/lib/i18n/hooks'

interface GenerateMoreButtonProps {
  onGenerateMore: () => void
  isLoading: boolean
}

export function GenerateMoreButton({ onGenerateMore, isLoading }: GenerateMoreButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      onClick={onGenerateMore}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors text-sm font-medium disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      Tạo thêm
    </button>
  )
}
