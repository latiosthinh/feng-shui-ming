'use client'
import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { generateNamesAction } from '@/lib/agent/actions/generate-names'
import type { NameGenerationRequest, NameGenerationResponse } from '@/lib/agent/types'
import type { FengShuiAnalysis } from '@/lib/fengshui/types'
import { useTranslation } from '@/lib/i18n/hooks'
import { NameCard } from './NameCard'
import { NameCardSkeleton } from './NameCardSkeleton'
import { StreamStatusBanner } from './StreamStatusBanner'
import { ErrorState } from './ErrorState'
import { RegenerateButton } from './RegenerateButton'
import { GenerateMoreButton } from './GenerateMoreButton'

type CardState =
  | { kind: 'skeleton' }
  | {
      kind: 'real'
      name: {
        native: string
        romanization: string
        meaning: string
        culturalSignificance: string
        nickname?: string
      }
      analysis?: FengShuiAnalysis
    }

type StreamPhase = 'thinking' | 'arriving'

interface StreamingResultsProps {
  request: NameGenerationRequest
  onComplete: (response: NameGenerationResponse) => void
  onRegenerate: () => void
  onGenerateMore: () => void
  isRegenerating: boolean
  initialResponse?: NameGenerationResponse
}

function isStreamingEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const stored = sessionStorage.getItem('fengshuiming-streaming')
    if (stored === 'false') return false
  } catch {}
  return true
}

function defaultAnalysis(): FengShuiAnalysis {
  return {
    fiveGrid: { tianGe: 0, renGe: 0, diGe: 0, waiGe: 0, zongGe: 0, overall: 'neutral' },
    wuXing: [],
    recommendations: [],
  }
}

export function StreamingResults({
  request,
  onComplete,
  onRegenerate,
  onGenerateMore,
  isRegenerating,
  initialResponse,
}: StreamingResultsProps) {
  const { t } = useTranslation()
  const nameCount = request.nameCount || 3

  const [cards, setCards] = useState<CardState[]>(() =>
    initialResponse
      ? initialResponse.names.map((n) => ({
          kind: 'real' as const,
          name: n,
          analysis: initialResponse.analysis,
        }))
      : Array.from({ length: nameCount }, () => ({ kind: 'skeleton' as const })),
  )
  const [response, setResponse] = useState<NameGenerationResponse | null>(initialResponse || null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!initialResponse)

  const streamPhase = cards.some((c) => c.kind === 'real') ? 'arriving' : 'thinking'

  const abortRef = useRef<AbortController | null>(null)
  const completedRef = useRef(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (initialResponse) return

    abortRef.current?.abort()
    completedRef.current = false

    const ctrl = new AbortController()
    abortRef.current = ctrl

    startTransition(() => {
      setCards(Array.from({ length: nameCount }, () => ({ kind: 'skeleton' })))
    })
    setLoading(true)
    setError(null)

    const doStream = isStreamingEnabled()
    if (!doStream) {
      runBlocking(ctrl)
      return
    }

    const softTimeout = setTimeout(() => {
      if (!ctrl.signal.aborted && !completedRef.current) {
        ctrl.abort()
        runBlocking(new AbortController())
      }
    }, 5000)

    fetch('/api/generate-names', {
      method: 'POST',
      signal: ctrl.signal,
      body: JSON.stringify(request),
    })
      .then(async (res) => {
        clearTimeout(softTimeout)

        if (!res.ok || !res.headers.get('Content-Type')?.includes('x-ndjson')) {
          runBlocking(new AbortController())
          return
        }

        if (ctrl.signal.aborted) return

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (!line.trim()) continue
              let msg: any
              try {
                msg = JSON.parse(line)
              } catch {
                continue
              }

              if (msg.type === 'name') {
                const name = msg.name
                setCards((prev) => {
                  const next = [...prev]
                  if (msg.index < next.length) {
                    next[msg.index] = { kind: 'real', name, analysis: name.analysis || undefined }
                  }
                  return next
                })
              } else if (msg.type === 'done') {
                completedRef.current = true
                setLoading(false)
                const finalResponse: NameGenerationResponse = {
                  names: [],
                  nickname: response?.nickname || t.results.nickname,
                }
                setResponse(finalResponse)
              } else if (msg.type === 'error') {
                if (!completedRef.current) {
                  runBlocking(new AbortController())
                }
              }
            }
          }
        } catch {
          if (!completedRef.current) {
            runBlocking(new AbortController())
          }
        }
      })
      .catch(() => {
        clearTimeout(softTimeout)
        if (!completedRef.current && !ctrl.signal.aborted) {
          runBlocking(new AbortController())
        }
      })

    function runBlocking(localCtrl: AbortController) {
      if (completedRef.current) return
      completedRef.current = true
      generateNamesAction(request)
        .then((res) => {
          if (localCtrl.signal.aborted) return
          setResponse(res)
          setCards(res.names.map((n) => ({ kind: 'real' as const, name: n })))
          setLoading(false)
        })
        .catch((err) => {
          if (localCtrl.signal.aborted) return
          completedRef.current = true
          const msg = err instanceof Error ? err.message : String(err)
          setError(translateError(msg))
          setLoading(false)
        })
    }

    return () => {
      ctrl.abort()
    }
  }, [request, initialResponse, nameCount])

  const prevResponseRef = useRef(response)
  useEffect(() => {
    if (response && response !== prevResponseRef.current) {
      prevResponseRef.current = response
      onComplete(response)
    }
  }, [response, onComplete])

  if (error) {
    return <ErrorState error={error} onRetry={onRegenerate} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">{t.results.generating}</h3>
        <div className="flex items-center gap-2">
          {loading && <StreamStatusBanner phase={streamPhase} />}
          {!loading && (
            <div className="flex items-center gap-2">
              <GenerateMoreButton onGenerateMore={onGenerateMore} isLoading={isRegenerating} />
              <RegenerateButton onRegenerate={onRegenerate} isLoading={isRegenerating} />
            </div>
          )}
        </div>
      </div>
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        aria-live="polite"
        aria-label={loading ? t.results.generatingNames : t.results.nameResults}
      >
        {cards.map((card, index) => {
          if (card.kind === 'real') {
            return (
              <div key={index} className="transition-opacity duration-300 opacity-100">
                <NameCard
                  name={card.name}
                  analysis={card.analysis || response?.analysis || defaultAnalysis()}
                  surname={request.surname}
                  birthDate={request.birthDate}
                  birthTime={request.birthTime}
                />
              </div>
            )
          }
          return (
            <div key={index} className="transition-opacity duration-300 opacity-100">
              <NameCardSkeleton />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function translateError(msg: string): string {
  if (msg.includes('timed out') || msg.includes('timeout'))
    return 'Yêu cầu đã hết thời gian. Vui lòng thử lại.'
  if (msg.includes('after 2 attempts')) return 'Không thể tạo tên. Vui lòng thử lại sau.'
  if (msg.includes('MIMO API error')) return 'Lỗi dịch vụ. Vui lòng thử lại.'
  if (msg.includes('fetch')) return 'Lỗi kết nối. Vui lòng kiểm tra mạng.'
  return msg
}
