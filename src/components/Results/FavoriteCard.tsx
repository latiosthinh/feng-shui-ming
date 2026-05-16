'use client'
import type { FavoriteEntry } from '@/lib/favorites/types'
import { useTranslation } from '@/lib/i18n/hooks'

interface FavoriteCardProps {
  entry: FavoriteEntry
  onRemove: (id: string) => void
}

export function FavoriteCard({ entry, onRemove }: FavoriteCardProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-2 animate-scale-in">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-xl font-bold text-gray-800">{entry.name.native}</h4>
          {entry.name.romanization && (
            <p className="text-gray-500 text-xs">{entry.name.romanization}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(entry.id)}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          aria-label={t.common.removeFavorite}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <p className="text-gray-600 text-sm">{entry.name.meaning}</p>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="px-2 py-0.5 bg-pink-50 text-pink-600 rounded-full">{entry.nickname}</span>
        <span>
          {entry.analysis.fiveGrid.overall === 'auspicious'
            ? t.results.auspicious
            : entry.analysis.fiveGrid.overall === 'inauspicious'
              ? t.results.inauspicious
              : t.results.neutral}
        </span>
      </div>
    </div>
  )
}
