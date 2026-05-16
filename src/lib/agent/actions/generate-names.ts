'use server'

import type {
  NameGenerationRequest,
  NameGenerationResponse,
} from '@/lib/agent/types'
import { getSystemPrompt } from '@/lib/agent/prompts'
import { saveNames } from '@/lib/agent/data/database'
import { buildPrompt } from '@/lib/agent/build-prompt'
import { parseResponse } from '@/lib/agent/parse-response'

export { parseResponse }

const API_URL = process.env.MIMO_API_BASE_URL || 'https://api.xiaomimimo.com/v1'
const API_KEY = process.env.MIMO_API_KEY!
const MODEL = process.env.MIMO_MODEL || 'mimo-v2.5-pro'

export async function generateNamesAction(
  request: NameGenerationRequest,
): Promise<NameGenerationResponse> {
  const nameCount = request.nameCount || 3
  const prompt = buildPrompt(request, nameCount)
  const systemPrompt = getSystemPrompt(request.locale)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90000)

  try {
    const res = await fetch(`${API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: Math.max(1024, (request.nameCount ?? 3) * 250 + 256),
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`MIMO API error ${res.status}: ${err}`)
    }

    const raw = await res.text()
    console.log(`[generateNames] raw length: ${raw.length}, preview: ${raw.substring(0, 300)}`)

    const data = JSON.parse(raw)
    const content = data.choices?.[0]?.message?.content || ''
    const reason = data.choices?.[0]?.finish_reason
    console.log(`[generateNames] finish_reason: ${reason}, content length: ${content.length}`)

    if (content) {
      const result = parseResponse(content, request.locale, request.surname)
      saveNames(result.names)
      return result
    }

    console.log(`[generateNames] empty content, full data:`, JSON.stringify(data).substring(0, 500))
    return parseResponse('', request.locale)
  } catch (err) {
    clearTimeout(timeout)
    if ((err as any)?.name === 'AbortError') {
      throw new Error('Request timed out after 90s')
    }
    throw err
  }
}