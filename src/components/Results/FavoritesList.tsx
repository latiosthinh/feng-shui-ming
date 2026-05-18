'use client'
import { useFavorites } from '@/lib/favorites/hooks'
import { FavoriteCard } from './FavoriteCard'
import { useTranslation } from '@/lib/i18n/hooks'
import { getLocalFavorites } from '@/lib/favorites/storage'

function exportFavorites() {
  const favorites = getLocalFavorites()
  if (favorites.length === 0) return
  const blob = new Blob([JSON.stringify(favorites, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const now = new Date().toISOString().split('T')[0]
  const a = document.createElement('a')
  a.href = url
  a.download = `fengshuiming-favorites-${now}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function FavoritesList() {
  const { favorites, remove, isLoading } = useFavorites()
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>❤️</span>
            {t.common.favorites}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-32 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (favorites.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>❤️</span>
            {t.common.favorites} ({favorites.length})
          </h3>
          <p className="text-xs text-gray-400 mt-1">{t.favorites.localNotice}</p>
        </div>
        <button
          onClick={exportFavorites}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {t.common.exportFavorites}
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
