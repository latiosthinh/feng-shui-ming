'use client'
import { useTranslation } from '@/lib/i18n/hooks'

export function NameCardSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      className="bg-white rounded-2xl shadow-lg p-6 space-y-4 overflow-hidden h-full flex flex-col"
      role="status"
      aria-label={t.results.generatingNames}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-7 w-32 rounded bg-gray-200 motion-safe:animate-shimmer" />
          <div className="h-4 w-24 rounded bg-gray-100 motion-safe:animate-shimmer" />
        </div>
        <div className="h-8 w-8 rounded-full bg-gray-200 motion-safe:animate-shimmer" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-gray-100 motion-safe:animate-shimmer" />
        <div className="h-4 w-3/4 rounded bg-gray-100 motion-safe:animate-shimmer" />
      </div>
      <div className="h-6 w-20 rounded-full bg-gray-100 motion-safe:animate-shimmer" />
      <div className="pt-2 border-t border-gray-100">
        <div className="flex flex-wrap gap-1.5">
          <div className="h-7 w-16 rounded-lg bg-gray-100 motion-safe:animate-shimmer" />
          <div className="h-7 w-16 rounded-lg bg-gray-100 motion-safe:animate-shimmer" />
          <div className="h-7 w-16 rounded-lg bg-gray-100 motion-safe:animate-shimmer" />
        </div>
      </div>
    </div>
  )
}
