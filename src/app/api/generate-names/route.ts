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

const analysisCache = createLRUCache<FengShuiAnalysis>(1000, 3600000)

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
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
            const name: GeneratedName = {
              native: item.name.native,
              romanization: item.name.romanization,
              meaning: item.name.meaning,
              culturalSignificance: item.name.culturalSignificance,
              nickname: item.name.nickname,
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
          saveNames(allNames)
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
