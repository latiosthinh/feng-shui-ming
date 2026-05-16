'use client'
import { useTranslation } from '@/lib/i18n/hooks'

interface SubmitButtonProps {
  isLoading: boolean
}

export function SubmitButton({ isLoading }: SubmitButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {t.common.loading}
        </>
      ) : (
        t.form.submit
      )}
    </button>
  )
}
