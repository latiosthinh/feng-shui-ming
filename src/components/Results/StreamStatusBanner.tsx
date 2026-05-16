'use client'
import { useTranslation } from '@/lib/i18n/hooks'

interface StreamStatusBannerProps {
  phase: 'thinking' | 'thinking-seeded' | 'arriving' | 'polishing'
}

export function StreamStatusBanner({ phase }: StreamStatusBannerProps) {
  const { t } = useTranslation()
  const labels = t.streamStatus
  const key = phase === 'thinking-seeded' ? 'thinkingSeeded' : phase
  const message = labels[key] || labels.thinking

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 rounded-lg bg-purple-50 border border-purple-100"
      role="status"
      aria-live="polite"
    >
      <div className="w-4 h-4 border-2 border-purple-300 rounded-full animate-spin border-t-purple-600" />
      <span className="text-sm text-purple-700 font-medium">{message}</span>
    </div>
  )
}
