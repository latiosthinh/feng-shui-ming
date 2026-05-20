import { NextRequest } from 'next/server'
import 'server-only'
import type { GeneratedName } from '@/lib/agent/types'
import type { FengShuiAnalysis } from '@/lib/fengshui/types'
import type { Locale } from '@/lib/i18n/types'
import { streamMimoCompletion } from '@/lib/agent/streaming/mimo-stream'
import { createIncrementalNameParser } from '@/lib/agent/streaming/incremental-parser'
import { analyzeName } from '@/lib/fengshui/engine'
import { createLRUCache } from '@/lib/fengshui/lru-cache'
import { saveNames } from '@/lib/agent/data/database'
import { checkUsage, incrementUsage } from '@/lib/auth/usage-guard'
import { createPocketBase } from '@/lib/pocketbase/client'
import { getChatNamesPrompt } from '@/lib/agent/prompts'

const analysisCache = createLRUCache<FengShuiAnalysis>(1000, 3600000)

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let body: { message: string; surname?: string; locale?: string; userId?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const fingerprint = request.headers.get('x-fingerprint') || 'unknown'
  const userId = body.userId || null

  let tier: 'free' | 'paid' = 'free'
  if (userId) {
    try {
      const pb = createPocketBase()
      const record = await pb.collection('users').getOne(userId)
      tier = record.tier || 'free'
    } catch {
      tier = 'free'
    }
  }

  const usageCheck = await checkUsage(userId, fingerprint, tier, 'chat')
  if (!usageCheck.allowed) {
    return new Response(JSON.stringify({ error: usageCheck.reason }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const locale = (body.locale as Locale) || 'vi'
  const systemPrompt = getChatNamesPrompt(locale)

  const userPrompt = body.message

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const parser = createIncrementalNameParser()
      const allNames: GeneratedName[] = []
      let index = 0

      try {
        for await (const chunk of streamMimoCompletion(systemPrompt, userPrompt, undefined)) {
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
            }
            allNames.push(name)

            let analysis: FengShuiAnalysis | null = null
            const effectiveSurname = body.surname || item.name.surname || ''
            if (effectiveSurname && name.native) {
              const cacheKey = `${effectiveSurname}|${name.native}`
              const cached = analysisCache.get(cacheKey)
              if (cached) {
                analysis = cached
              } else {
                analysis = analyzeName({ surname: effectiveSurname, givenName: name.native })
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
          await incrementUsage(userId, fingerprint, 'chat', allNames.length)
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
