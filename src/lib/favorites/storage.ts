import type { FavoriteEntry } from './types'

const STORAGE_KEY = 'fengshuiming-favorites'
const MAX_FAVORITES = 50

export function getFavorites(): FavoriteEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveFavorite(entry: FavoriteEntry): { success: boolean; reason?: string } {
  if (typeof window === 'undefined') return { success: false }
  const favorites = getFavorites()
  if (favorites.some((f) => f.id === entry.id)) return { success: false, reason: 'duplicate' }
  if (favorites.length >= MAX_FAVORITES) return { success: false, reason: 'limit' }
  favorites.push(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  return { success: true }
}

export function removeFavorite(id: string): void {
  if (typeof window === 'undefined') return
  const favorites = getFavorites().filter((f) => f.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((f) => f.id === id)
}

export function exportFavorites(): void {
  if (typeof window === 'undefined') return
  const favorites = getFavorites()
  const blob = new Blob([JSON.stringify(favorites, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const now = new Date().toISOString().split('T')[0]
  const a = document.createElement('a')
  a.href = url
  a.download = `fengshuiming-favorites-${now}.json`
  a.click()
  URL.revokeObjectURL(url)
}
