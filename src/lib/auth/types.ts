import type { Locale } from '@/lib/i18n/types'

export type UserTier = 'free' | 'paid'

export interface UserProfile {
  id: string
  email: string
  tier: UserTier
  purchaseCode: string
  totalGenerations: number
  totalAnalyzes: number
  totalFavorites: number
}

export interface AnonymousUsage {
  id: string
  fingerprint: string
  totalGenerations: number
  totalAnalyzes: number
  totalFavorites: number
}

export const LIMITS = {
  anonymous: {
    generations: 5,
    analyzes: 1,
    favorites: 9,
  },
  free: {
    generations: 10,
    analyzes: 5,
    favorites: 9,
  },
  paid: {
    generations: Infinity,
    analyzes: Infinity,
    favorites: 100,
  },
} as const

export type UsageSource = 'form' | 'random'

export interface UsageCheck {
  allowed: boolean
  remaining: number
  limit: number
  reason?: string
}

export function getLimits(tier: UserTier, isAnonymous: boolean) {
  if (isAnonymous) return LIMITS.anonymous
  if (tier === 'paid') return LIMITS.paid
  return LIMITS.free
}

export function generatePurchaseCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segments = Array.from({ length: 2 }, () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''),
  )
  return `FSM-${segments.join('-')}`
}
