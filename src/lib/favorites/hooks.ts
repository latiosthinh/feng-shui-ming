'use client'
import { useState, useCallback, useEffect } from 'react'
import type { FavoriteEntry } from './types'
import { getFavorites, saveFavorite, removeFavorite, isFavorite, exportFavorites } from './storage'

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([])
  const [limitReached, setLimitReached] = useState(false)

  useEffect(() => {
    setFavorites(getFavorites())
  }, [])

  const refresh = useCallback(() => {
    setFavorites(getFavorites())
  }, [])

  const add = useCallback((entry: FavoriteEntry): boolean => {
    const result = saveFavorite(entry)
    if (result.reason === 'limit') {
      setLimitReached(true)
      return false
    }
    setFavorites(getFavorites())
    return true
  }, [])

  const remove = useCallback((id: string) => {
    removeFavorite(id)
    setFavorites(getFavorites())
  }, [])

  const isFav = useCallback((id: string) => isFavorite(id), [])

  return { favorites, add, remove, isFav, limitReached, setLimitReached, refresh, exportFavorites }
}
