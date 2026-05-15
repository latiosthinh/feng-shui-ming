"use client"
import { useFavorites } from "@/lib/favorites/hooks"
import { FavoriteCard } from "./FavoriteCard"
import { useTranslation } from "@/lib/i18n/hooks"

export function FavoritesList() {
  const { favorites, remove } = useFavorites()
  const { t } = useTranslation()

  if (favorites.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <span>❤️</span>
        {t.common.favorites} ({favorites.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((entry) => (
          <FavoriteCard key={entry.id} entry={entry} onRemove={remove} />
        ))}
      </div>
    </div>
  )
}
