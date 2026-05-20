'use server'

import type { NameGenerationRequest, NameGenerationResponse } from '@/lib/agent/types'
import { getSystemPrompt } from '@/lib/agent/prompts'
import { saveNames } from '@/lib/agent/data/database'
import { buildPrompt } from '@/lib/agent/build-prompt'
import { parseResponse } from '@/lib/agent/parse-response'
import { getRequiredEnvVar } from '@/lib/env'

export { parseResponse }

const API_URL = process.env.MIMO_API_BASE_URL || 'https://api.xiaomimimo.com/v1'
const API_KEY = getRequiredEnvVar('MIMO_API_KEY')
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
        max_completion_tokens: 4096,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`MIMO API error ${res.status}`)
    }

    const raw = await res.text()
    const data = JSON.parse(raw)
    const content = data.choices?.[0]?.message?.content || ''
    const reason = data.choices?.[0]?.finish_reason
    console.log(`[generateNames] finish_reason: ${reason}, content length: ${content.length}`)

    if (content) {
      const result = parseResponse(content, request.locale, request.surname)
      await saveNames(result.names)
      return result
    }

    return parseResponse('', request.locale)
  } catch (err) {
    clearTimeout(timeout)
    if ((err as any)?.name === 'AbortError') {
      throw new Error('Request timed out after 90s')
    }
    throw err
  }
}
