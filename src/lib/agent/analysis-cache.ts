'use client'

import type { NameAnalysis } from '@/lib/agent/types'

const CACHE_PREFIX = 'fengshuiming-analysis:'

export function getCachedAnalysis(
  name: string,
  surname: string,
  type: string,
): NameAnalysis | null {
  if (typeof window === 'undefined') return null
  try {
    const key = `${CACHE_PREFIX}${name}:${surname}:${type}`
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as NameAnalysis
  } catch {
    return null
  }
}

export function setCachedAnalysis(analysis: NameAnalysis): void {
  if (typeof window === 'undefined') return
  try {
    const key = `${CACHE_PREFIX}${analysis.name}:${analysis.surname}:${analysis.type}`
    localStorage.setItem(key, JSON.stringify(analysis))
  } catch {}
}

export function clearNameCache(name: string, surname: string): void {
  if (typeof window === 'undefined') return
  try {
    const prefix = `${CACHE_PREFIX}${name}:${surname}:`
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) localStorage.removeItem(key)
    }
  } catch {}
}
