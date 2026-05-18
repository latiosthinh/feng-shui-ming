'use client'
import { useState, useCallback, useEffect } from 'react'
import type { FavoriteEntry } from './types'
import { useAuth } from '@/lib/auth/context'
import {
  getFavoritesAction,
  addFavoriteAction,
  removeFavoriteAction,
  isFavoriteAction,
} from './actions'
import {
  getLocalFavorites,
  saveLocalFavorite,
  removeLocalFavorite,
  isLocalFavorite,
  migrateLocalToFavorites,
} from './storage'

export function useFavorites() {
  const { user, fingerprint } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([])
  const [limitReached, setLimitReached] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [user?.id])

  const loadFavorites = useCallback(async () => {
    setIsLoading(true)
    if (user?.id) {
      const pbFavs = await getFavoritesAction(user.id, fingerprint)
      setFavorites(pbFavs)

      if (pbFavs.length === 0) {
        await migrateLocalToFavorites()
        const migrated = await getFavoritesAction(user.id, fingerprint)
        setFavorites(migrated)
      }
    } else {
      const pbFavs = await getFavoritesAction(null, fingerprint)
      if (pbFavs.length > 0) {
        setFavorites(pbFavs)
      } else {
        setFavorites(getLocalFavorites())
      }
    }
    setIsLoading(false)
  }, [user?.id, fingerprint])

  const refresh = useCallback(() => {
    loadFavorites()
  }, [loadFavorites])

  const add = useCallback(
    async (entry: FavoriteEntry): Promise<boolean> => {
      if (user?.id) {
        const result = await addFavoriteAction(user.id, fingerprint, {
          name: entry.name,
          analysis: entry.analysis,
          nickname: entry.nickname,
          locale: entry.locale,
        })
        if (result.reason === 'limit') {
          setLimitReached(true)
          return false
        }
        if (result.success) {
          await loadFavorites()
        }
        return result.success
      } else {
        const result = saveLocalFavorite(entry)
        if (result.reason === 'limit') {
          setLimitReached(true)
          return false
        }
        setFavorites(getLocalFavorites())
        return result.success
      }
    },
    [user?.id, fingerprint, loadFavorites],
  )

  const remove = useCallback(
    async (id: string) => {
      if (user?.id) {
        await removeFavoriteAction(user.id, fingerprint, id)
        await loadFavorites()
      } else {
        removeLocalFavorite(id)
        setFavorites(getLocalFavorites())
      }
    },
    [user?.id, fingerprint, loadFavorites],
  )

  const isFav = useCallback(
    async (id: string) => {
      const entry = favorites.find((f) => f.id === id)
      if (!entry) return false

      if (user?.id) {
        return isFavoriteAction(user.id, fingerprint, entry.name.native)
      }
      return isLocalFavorite(id)
    },
    [user?.id, fingerprint, favorites],
  )

  return { favorites, add, remove, isFav, limitReached, setLimitReached, refresh, isLoading }
}
