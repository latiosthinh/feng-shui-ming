'use client'
import { useFavorites } from '@/lib/favorites/hooks'
import { FavoriteCard } from './FavoriteCard'
import { useTranslation } from '@/lib/i18n/hooks'

export function FavoritesList() {
  const { favorites, remove, exportFavorites } = useFavorites()
  const { t, locale } = useTranslation()

  if (favorites.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>❤️</span>
          {t.common.favorites} ({favorites.length})
        </h3>
        <button
          onClick={exportFavorites}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {locale === 'vi' ? 'Xu&#7845;t' : '导出'}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((entry) => (
          <FavoriteCard key={entry.id} entry={entry} onRemove={remove} />
        ))}
      </div>
    </div>
  )
}
