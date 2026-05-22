import 'server-only'
import { NextRequest } from 'next/server'
import type { NameGenerationRequest, GeneratedName } from '@/lib/agent/types'
import type { FengShuiAnalysis } from '@/lib/fengshui/types'
import { getSystemPrompt } from '@/lib/agent/prompts'
import { saveNames } from '@/lib/agent/data/database'
import { streamMimoCompletion } from '@/lib/agent/streaming/mimo-stream'
import { createIncrementalNameParser } from '@/lib/agent/streaming/incremental-parser'
import { analyzeName } from '@/lib/fengshui/engine'
import { createLRUCache } from '@/lib/fengshui/lru-cache'
import { buildPrompt } from '@/lib/agent/build-prompt'
import { checkUsage, incrementUsage } from '@/lib/auth/usage-guard'

const analysisCache = createLRUCache<FengShuiAnalysis>(1000, 3600000)

const MAX_REQUESTS = 10
const WINDOW_MS = 60_000
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const rateLimitMap = new Map<string, number[]>()

/**
 * NOTE: This rate limiter is in-memory only and does not persist across
 * server restarts or scale across multiple instances. For production with
 * multiple replicas, consider switching to Redis or PocketBase-backed
 * rate limiting. See scripts/pocketbase-schema.md for schema reference.
 */

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) ?? []
  const valid = timestamps.filter((t) => now - t < WINDOW_MS)
  if (valid.length >= MAX_REQUESTS) return false
  valid.push(now)
  rateLimitMap.set(ip, valid)
  return true
}

setInterval(
  () => {
    const now = Date.now()
    for (const [ip, timestamps] of rateLimitMap) {
      const valid = timestamps.filter((t) => now - t < WINDOW_MS)
      if (valid.length === 0) rateLimitMap.delete(ip)
      else rateLimitMap.set(ip, valid)
    }
  },
  5 * 60 * 1000,
)

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Try again later.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: NameGenerationRequest
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const nameCount = body.nameCount || 3

  const fingerprint = request.headers.get('x-fingerprint') || ''
  const reqBody = body as NameGenerationRequest & { userId?: string }
  const userId = reqBody.userId || null
  if (fingerprint) {
    let tier: 'free' | 'paid' = 'free'
    if (userId) {
      try {
        const { createPocketBase } = await import('@/lib/pocketbase/client')
        const pb = createPocketBase()
        const record = await pb.collection('users').getOne(userId)
        tier = record.tier || 'free'
      } catch {
        tier = 'free'
      }
    }
    const usageCheck = await checkUsage(userId, fingerprint, tier, 'form')
    if (!usageCheck.allowed) {
      return new Response(JSON.stringify({ error: usageCheck.reason }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  const prompt = buildPrompt(body, nameCount)
  const systemPrompt = getSystemPrompt(body.locale)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const parser = createIncrementalNameParser()
      const allNames: GeneratedName[] = []
      let index = 0

      try {
        for await (const chunk of streamMimoCompletion(systemPrompt, prompt, request.signal)) {
          const parsed = parser.push(chunk)
          for (const item of parsed) {
            if (!item.name.native || !item.name.native.trim()) continue

            const name: GeneratedName = {
              native: item.name.native,
              romanization: item.name.romanization,
              hanzi: item.name.hanzi,
              meaning: item.name.meaning,
              culturalSignificance: item.name.culturalSignificance,
              nickname: item.name.nickname,
              englishName: item.name.englishName || undefined,
              teasingFlags: Array.isArray(item.name.teasingFlags) && item.name.teasingFlags.length > 0 ? item.name.teasingFlags : undefined,
              nicknameSuggestions: Array.isArray(item.name.nicknameSuggestions) && item.name.nicknameSuggestions.length > 0 ? item.name.nicknameSuggestions : undefined,
            }
            allNames.push(name)

            let analysis: FengShuiAnalysis | null = null
            if (body.surname && name.native) {
              const cacheKey = `${body.surname}|${name.native}`
              const cached = analysisCache.get(cacheKey)
              if (cached) {
                analysis = cached
              } else {
                analysis = analyzeName({ surname: body.surname, givenName: name.native })
                analysisCache.set(cacheKey, analysis)
              }
            }

            const msg = JSON.stringify({
              type: 'name',
              index,
              name: {
                ...name,
                analysis,
              },
            })
            controller.enqueue(encoder.encode(msg + '\n'))
            index++
          }
        }

        if (allNames.length > 0) {
          await saveNames(allNames)
          if (fingerprint) {
            await incrementUsage(userId, fingerprint, 'form', allNames.length)
          }
        }

        controller.enqueue(
          encoder.encode(JSON.stringify({ type: 'done', count: allNames.length }) + '\n'),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', message }) + '\n'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
