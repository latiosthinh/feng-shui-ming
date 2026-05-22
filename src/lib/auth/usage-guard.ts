import { createPocketBase } from '@/lib/pocketbase/client'
import type { UserTier, UsageCheck, UsageSource } from '@/lib/auth/types'
import { getLimits } from '@/lib/auth/types'

export async function checkUsage(
  userId: string | null,
  fingerprint: string,
  tier: UserTier,
  source: UsageSource,
): Promise<UsageCheck> {
  const limits = getLimits(tier, !userId)

  let currentGenerations = 0
  let currentAnalyzes = 0

  if (userId) {
    try {
      const pb = createPocketBase()
      const record = await pb.collection('users').getOne(userId)
      currentGenerations = record.totalGenerations || 0
      currentAnalyzes = record.totalAnalyzes || 0
    } catch {
      // PB unavailable — assume no prior usage so generation is not blocked
    }
  } else {
    try {
      const pb = createPocketBase()
      const records = await pb.collection('anonymous_usage').getFullList({
        filter: 'fingerprint = {:fingerprint}',
        filterParams: { fingerprint },
      })
      if (records.length > 0) {
        currentGenerations = records[0].totalGenerations || 0
        currentAnalyzes = records[0].totalAnalyzes || 0
      }
    } catch {
      // PB unavailable — assume no prior usage so generation is not blocked
    }
  }

  let current: number
  let limit: number
  let action: string

  switch (source) {
    case 'form':
      current = currentGenerations
      limit = limits.generations
      action = 'generation'
      break
    case 'random':
      current = currentGenerations
      limit = limits.generations
      action = 'generation'
      break
    default:
      current = currentGenerations
      limit = limits.generations
      action = 'generation'
  }

  if (current >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      reason: `You have reached your ${action} limit (${limit}). ${!userId ? 'Login for more.' : tier === 'free' ? 'Upgrade to paid for unlimited.' : ''}`,
    }
  }

  return {
    allowed: true,
    remaining: limit - current,
    limit,
  }
}

export async function incrementUsage(
  userId: string | null,
  fingerprint: string,
  source: UsageSource,
  count: number = 1,
): Promise<void> {
  try {
    const pb = createPocketBase()

    if (userId) {
      const record = await pb.collection('users').getOne(userId)
      const updates: Record<string, number> = {}
      if (source === 'form' || source === 'random') {
        updates.totalGenerations = (record.totalGenerations || 0) + count
      }
      if (Object.keys(updates).length > 0) {
        await pb.collection('users').update(userId, updates)
      }
    } else {
      const records = await pb.collection('anonymous_usage').getFullList({
        filter: 'fingerprint = {:fingerprint}',
        filterParams: { fingerprint },
      })

      if (records.length > 0) {
        const updates: Record<string, number> = {}
        if (source === 'form' || source === 'random') {
          updates.totalGenerations = (records[0].totalGenerations || 0) + count
        }
        if (Object.keys(updates).length > 0) {
          await pb.collection('anonymous_usage').update(records[0].id, updates)
        }
      } else {
        const data: Record<string, string | number> = { fingerprint }
        if (source === 'form' || source === 'random') {
          data.totalGenerations = count
        }
        data.totalAnalyzes = 0
        data.totalFavorites = 0
        await pb.collection('anonymous_usage').create(data)
      }
    }
  } catch {
    // PB unavailable — usage tracking skipped, generation still works
  }
}

export async function incrementAnalyzeUsage(
  userId: string | null,
  fingerprint: string,
): Promise<void> {
  try {
    const pb = createPocketBase()

    if (userId) {
      const record = await pb.collection('users').getOne(userId)
      await pb.collection('users').update(userId, {
        totalAnalyzes: (record.totalAnalyzes || 0) + 1,
      })
    } else {
      const records = await pb.collection('anonymous_usage').getFullList({
        filter: 'fingerprint = {:fingerprint}',
        filterParams: { fingerprint },
      })

      if (records.length > 0) {
        await pb.collection('anonymous_usage').update(records[0].id, {
          totalAnalyzes: (records[0].totalAnalyzes || 0) + 1,
        })
      } else {
        await pb.collection('anonymous_usage').create({
          fingerprint,
        totalGenerations: 0,
        totalAnalyzes: 1,
        totalFavorites: 0,
        })
      }
    }
  } catch {
    // PB unavailable — usage tracking skipped
  }
}
