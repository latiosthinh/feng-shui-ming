export interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export function createLRUCache<T>(maxSize: number = 1000, ttlMs: number = 3600000) {
  const cache = new Map<string, CacheEntry<T>>()

  function prune() {
    const now = Date.now()
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= now) cache.delete(key)
    }
    if (cache.size > maxSize) {
      const iter = cache.keys()
      while (cache.size > maxSize) {
        const key = iter.next()
        if (key.done) break
        cache.delete(key.value)
      }
    }
  }

  return {
    get(key: string): T | undefined {
      const entry = cache.get(key)
      if (!entry) return undefined
      if (entry.expiresAt <= Date.now()) {
        cache.delete(key)
        return undefined
      }
      // Move to end (most recently used)
      cache.delete(key)
      cache.set(key, entry)
      return entry.value
    },
    set(key: string, value: T): void {
      prune()
      cache.delete(key)
      cache.set(key, { value, expiresAt: Date.now() + ttlMs })
    },
    has(key: string): boolean {
      return this.get(key) !== undefined
    },
    clear(): void {
      cache.clear()
    },
    get size(): number {
      prune()
      return cache.size
    },
  }
}
