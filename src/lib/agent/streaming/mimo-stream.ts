import 'server-only'
import { getRequiredEnvVar } from '@/lib/env'

const API_URL = process.env.MIMO_API_BASE_URL || 'https://api.xiaomimimo.com/v1'
const API_KEY = getRequiredEnvVar('MIMO_API_KEY')
const MODEL = process.env.MIMO_MODEL || 'mimo-v2.5-pro'

export async function* streamMimoCompletion(
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal,
): AsyncIterable<string> {
  let gotFirstByte = false
  let retried = false

  const attempt = async (): Promise<Response> => {
    const controller = new AbortController()
    const combined = signal ? combineSignals(signal, controller.signal) : controller.signal

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
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.9,
          max_completion_tokens: 4096,
          stream: true,
        }),
        signal: combined,
      })
      return res
    } finally {
      clearTimeout(timeout)
    }
  }

  let res: Response | null = null
  try {
    res = await attempt()
  } catch (err) {
    if (!retried && !gotFirstByte && err instanceof TypeError && !signal?.aborted) {
      retried = true
      await sleep(2000)
      res = await attempt()
    } else {
      throw err
    }
  }

  if (res && !res.ok && res.status >= 500 && !retried && !gotFirstByte) {
    retried = true
    await sleep(2000)
    res = await attempt()
  }

  if (!res || !res.ok) {
    const status = res?.status ?? 'connection'
    const errText = res ? await res.text().catch(() => 'unknown') : 'fetch failed'
    throw new Error(`MIMO API error ${status}: ${errText}`)
  }

  if (!res.body) {
    throw new Error('MIMO response has no body')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      if (!gotFirstByte && value.length > 0) gotFirstByte = true

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        if (!trimmed.startsWith('data: ')) continue

        const jsonStr = trimmed.slice(6)
        try {
          const data = JSON.parse(jsonStr)
          const delta = data.choices?.[0]?.delta
          const content = delta?.content
          if (content) {
            yield content
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    if (buffer.trim()) {
      const trimmed = buffer.trim()
      if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
        const jsonStr = trimmed.slice(6)
        try {
          const data = JSON.parse(jsonStr)
          const delta = data.choices?.[0]?.delta?.content
          if (delta) yield delta
        } catch {}
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function combineSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  const cleanups: (() => void)[] = []

  const abort = (reason?: unknown) => {
    for (const cleanup of cleanups) cleanup()
    controller.abort(reason)
  }

  for (const signal of signals) {
    if (signal.aborted) {
      abort(signal.reason)
      return controller.signal
    }
    const listener = () => abort(signal.reason)
    signal.addEventListener('abort', listener, { once: true })
    cleanups.push(() => signal.removeEventListener('abort', listener))
  }

  controller.signal.addEventListener(
    'abort',
    () => {
      for (const cleanup of cleanups) cleanup()
    },
    { once: true },
  )

  return controller.signal
}
