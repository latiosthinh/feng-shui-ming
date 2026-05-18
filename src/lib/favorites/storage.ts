import type { FavoriteEntry } from './types'
import { createPocketBase } from '@/lib/pocketbase/client'

const LOCAL_KEY = 'fengshuiming-favorites'
const MAX_FAVORITES_LOCAL = 50

export function getLocalFavorites(): FavoriteEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(LOCAL_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveLocalFavorite(entry: FavoriteEntry): { success: boolean; reason?: string } {
  if (typeof window === 'undefined') return { success: false }
  const favorites = getLocalFavorites()
  if (favorites.some((f) => f.id === entry.id)) return { success: false, reason: 'duplicate' }
  if (favorites.length >= MAX_FAVORITES_LOCAL) return { success: false, reason: 'limit' }
  favorites.push(entry)
  localStorage.setItem(LOCAL_KEY, JSON.stringify(favorites))
  return { success: true }
}

export function removeLocalFavorite(id: string): void {
  if (typeof window === 'undefined') return
  const favorites = getLocalFavorites().filter((f) => f.id !== id)
  localStorage.setItem(LOCAL_KEY, JSON.stringify(favorites))
}

export function isLocalFavorite(id: string): boolean {
  return getLocalFavorites().some((f) => f.id === id)
}

export function clearLocalFavorites(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LOCAL_KEY)
}

export async function migrateLocalToFavorites(): Promise<void> {
  const local = getLocalFavorites()
  if (local.length === 0) return

  const pb = createPocketBase()
  if (!pb.authStore.isValid) return

  for (const entry of local) {
    const existing = await pb.collection('favorites').getFullList({
      filter: `user = "${pb.authStore.record?.id}" && native = "${entry.name.native}"`,
    })
    if (existing.length === 0) {
      await pb.collection('favorites').create({
        user: pb.authStore.record?.id,
        native: entry.name.native,
        romanization: entry.name.romanization,
        meaning: entry.name.meaning,
        culturalSignificance: entry.name.culturalSignificance,
        nickname: entry.nickname,
        analysis: entry.analysis,
        locale: entry.locale,
      })
    }
  }
  clearLocalFavorites()
}
