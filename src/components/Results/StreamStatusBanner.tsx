'use client'
import { useTranslation } from '@/lib/i18n/hooks'

interface StreamStatusBannerProps {
  phase: 'thinking' | 'thinking-seeded' | 'arriving' | 'polishing'
}

const PHASE_LABELS: Record<string, Record<string, string>> = {
  zh: {
    thinking: '正在思考…',
    'thinking-seeded': '正在挑选合适的名字…',
    arriving: '首个名字已生成…',
    polishing: '正在完善…',
  },
  vi: {
    thinking: 'Đang nghĩ…',
    'thinking-seeded': 'Đang chọn tên phù hợp…',
    arriving: 'Tên đầu tiên đã đến…',
    polishing: 'Hoàn thiện…',
  },
}

export function StreamStatusBanner({ phase }: StreamStatusBannerProps) {
  const { locale } = useTranslation()
  const labels = PHASE_LABELS[locale] || PHASE_LABELS.zh
  const message = labels[phase] || labels['thinking']

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
