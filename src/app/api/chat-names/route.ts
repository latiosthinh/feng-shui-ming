import { NextRequest } from 'next/server'
import 'server-only'
import type { GeneratedName } from '@/lib/agent/types'
import type { FengShuiAnalysis } from '@/lib/fengshui/types'
import { streamMimoCompletion } from '@/lib/agent/streaming/mimo-stream'
import { createIncrementalNameParser } from '@/lib/agent/streaming/incremental-parser'
import { analyzeName } from '@/lib/fengshui/engine'
import { createLRUCache } from '@/lib/fengshui/lru-cache'
import { saveNames } from '@/lib/agent/data/database'
import { checkUsage, incrementUsage } from '@/lib/auth/usage-guard'
import { createPocketBase } from '@/lib/pocketbase/client'

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

  const systemPrompt = `Bạn là chuyên gia đặt tên phong thủy. Người dùng sẽ mô tả sở thích của họ bằng ngôn ngữ tự nhiên.

QUAN TRỌNG:
1. CHỈ trả lời các yêu cầu liên quan đến đặt tên em bé/phong thủy. Nếu người dùng hỏi chuyện khác, trả lời lịch sự rằng bạn chỉ hỗ trợ đặt tên.
2. Trích xuất thông tin từ tin nhắn của họ: họ (nếu có), giới tính, ý nghĩa mong muốn, sở thích.
3. Tạo 3-5 tên theo mô tả của họ.
4. CHỈ xuất ra mảng JSON, không kèm văn bản khác: [{"native":"","romanization":"","hanzi":"","meaning":"","culturalSignificance":"","nickname":""}]

Nếu tin nhắn không liên quan đến đặt tên, trả lời: "Xin lỗi, tôi chỉ có thể hỗ trợ đặt tên phong thủy. Bạn muốn tôi giúp đặt tên cho bé?"`

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
