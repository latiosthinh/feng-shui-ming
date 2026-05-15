"use client"
import { useTranslation } from "@/lib/i18n/hooks"

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message }: LoadingStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">☯</div>
      </div>
      <p className="text-gray-600 animate-pulse-gentle">{message || t.common.loading}</p>
    </div>
  )
}
