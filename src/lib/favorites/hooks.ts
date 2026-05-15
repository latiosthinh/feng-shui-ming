"use client"
import { useState, useCallback, useEffect } from "react"
import type { FavoriteEntry } from "./types"
import { getFavorites, saveFavorite, removeFavorite, isFavorite } from "./storage"

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([])

  useEffect(() => {
    setFavorites(getFavorites())
  }, [])

  const add = useCallback((entry: FavoriteEntry) => {
    saveFavorite(entry)
    setFavorites(getFavorites())
  }, [])

  const remove = useCallback((id: string) => {
    removeFavorite(id)
    setFavorites(getFavorites())
  }, [])

  const isFav = useCallback((id: string) => isFavorite(id), [])

  return { favorites, add, remove, isFav }
}
