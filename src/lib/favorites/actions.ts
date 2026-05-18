'use server'

import { createPocketBase } from '@/lib/pocketbase/client'
import type { FavoriteEntry } from './types'
import { getLimits } from '@/lib/auth/types'

export async function getFavoritesAction(
  userId: string | null,
  fingerprint: string,
): Promise<FavoriteEntry[]> {
  const pb = createPocketBase()

  if (userId) {
    try {
      const records = await pb.collection('favorites').getFullList({
        filter: `user = "${userId}"`,
        sort: '-created',
      })
      return records.map(mapRecordToEntry)
    } catch {
      return []
    }
  }

  try {
    const records = await pb.collection('favorites').getFullList({
      filter: `fingerprint = "${fingerprint}"`,
      sort: '-created',
    })
    return records.map(mapRecordToEntry)
  } catch {
    return []
  }
}

export async function addFavoriteAction(
  userId: string | null,
  fingerprint: string,
  entry: Omit<FavoriteEntry, 'id' | 'savedAt'>,
): Promise<{ success: boolean; reason?: string }> {
  const pb = createPocketBase()

  const tier = userId ? await getUserTier(userId) : 'free'
  const limits = getLimits(tier, !userId)

  const currentCount = await getFavoriteCount(userId, fingerprint)
  if (currentCount >= limits.favorites) {
    return { success: false, reason: 'limit' }
  }

  try {
    await pb.collection('favorites').create({
      user: userId,
      fingerprint: userId ? undefined : fingerprint,
      native: entry.name.native,
      romanization: entry.name.romanization,
      meaning: entry.name.meaning,
      culturalSignificance: entry.name.culturalSignificance,
      nickname: entry.nickname,
      analysis: entry.analysis,
      locale: entry.locale,
    })

    if (userId) {
      const user = await pb.collection('users').getOne(userId)
      await pb.collection('users').update(userId, {
        totalFavorites: (user.totalFavorites || 0) + 1,
      })
    }

    return { success: true }
  } catch {
    return { success: false, reason: 'error' }
  }
}

export async function removeFavoriteAction(
  userId: string | null,
  fingerprint: string,
  id: string,
): Promise<void> {
  const pb = createPocketBase()
  try {
    await pb.collection('favorites').delete(id)
  } catch {
    // ignore
  }
}

export async function isFavoriteAction(
  userId: string | null,
  fingerprint: string,
  native: string,
): Promise<boolean> {
  const pb = createPocketBase()
  try {
    const filter = userId
      ? `user = "${userId}" && native = "${native}"`
      : `fingerprint = "${fingerprint}" && native = "${native}"`
    const records = await pb.collection('favorites').getFullList({ filter })
    return records.length > 0
  } catch {
    return false
  }
}

async function getUserTier(userId: string): Promise<'free' | 'paid'> {
  try {
    const pb = createPocketBase()
    const user = await pb.collection('users').getOne(userId)
    return user.tier || 'free'
  } catch {
    return 'free'
  }
}

async function getFavoriteCount(userId: string | null, fingerprint: string): Promise<number> {
  const pb = createPocketBase()
  try {
    const filter = userId
      ? `user = "${userId}"`
      : `fingerprint = "${fingerprint}"`
    const records = await pb.collection('favorites').getFullList({ filter })
    return records.length
  } catch {
    return 0
  }
}

function mapRecordToEntry(record: any): FavoriteEntry {
  return {
    id: record.id,
    name: {
      native: record.native || '',
      romanization: record.romanization || '',
      meaning: record.meaning || '',
      culturalSignificance: record.culturalSignificance || '',
      nickname: record.nickname || undefined,
    },
    analysis: record.analysis || { fiveGrid: { tianGe: 0, renGe: 0, diGe: 0, waiGe: 0, zongGe: 0, overall: 'neutral' }, wuXing: [], recommendations: [] },
    nickname: record.nickname || '',
    savedAt: record.created || '',
    locale: record.locale || 'vi',
  }
}
