import type { FavoriteEntry } from "./types"

const STORAGE_KEY = "fengshuiming-favorites"

export function getFavorites(): FavoriteEntry[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveFavorite(entry: FavoriteEntry): void {
  if (typeof window === "undefined") return
  const favorites = getFavorites()
  if (favorites.some((f) => f.id === entry.id)) return
  favorites.push(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
}

export function removeFavorite(id: string): void {
  if (typeof window === "undefined") return
  const favorites = getFavorites().filter((f) => f.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((f) => f.id === id)
}
