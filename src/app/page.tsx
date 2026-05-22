'use client'
import { LanguageSelector } from '@/components/LanguageSelector'
import { NameForm } from '@/components/NameForm'
import { ResultsContainer } from '@/components/Results/ResultsContainer'
import { FavoritesList } from '@/components/Results/FavoritesList'
import { UserMenu } from '@/components/Auth/UserMenu'
import { useAppTour } from '@/lib/tour/useAppTour'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import type {
  NameGenerationRequest,
  NameGenerationResponse,
  GeneratedName,
} from '@/lib/agent/types'
import { getRandomNamesAction } from '@/lib/agent/actions/random-names'
import { useTranslation } from '@/lib/i18n/hooks'

function loadPreviousNames(): GeneratedName[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = sessionStorage.getItem('fengshuiming-previous-names')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function savePreviousNames(names: GeneratedName[]) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem('fengshuiming-previous-names', JSON.stringify(names))
  } catch {}
}

export default function Home() {
  const { locale, t } = useTranslation()
  const { user } = useAuth()
  const { startTour, hasCompletedTour, resetTour } = useAppTour()
  const [request, setRequest] = useState<NameGenerationRequest | null>(null)
  const [response, setResponse] = useState<NameGenerationResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const previousNamesRef = useRef<GeneratedName[]>(loadPreviousNames())
  const appendingRef = useRef(false)
  const savedNamesRef = useRef<GeneratedName[]>([])

  const persistPreviousNames = useCallback((names: GeneratedName[]) => {
    previousNamesRef.current = names
    savePreviousNames(names)
  }, [])

  const tourStartedRef = useRef(false)
  useEffect(() => {
    if (!tourStartedRef.current) {
      tourStartedRef.current = true
      if (!hasCompletedTour()) {
        setTimeout(() => startTour(), 1000)
      }
    }
  }, [hasCompletedTour, startTour])

  const handleRestartTour = useCallback(() => {
    resetTour()
    setTimeout(() => startTour(), 500)
  }, [resetTour, startTour])

  const handleSubmit = useCallback(
    (req: NameGenerationRequest) => {
      appendingRef.current = false
      savedNamesRef.current = []
      persistPreviousNames([])
      setRequest(req)
      setResponse(null)
      setIsGenerating(true)
    },
    [persistPreviousNames],
  )

  const handleRandom = useCallback(async () => {
    appendingRef.current = false
    savedNamesRef.current = []
    setResponse(null)
    setIsGenerating(true)
    try {
      const res = await getRandomNamesAction(undefined, 5, 'neutral', locale)
      setResponse(res)
      setRequest({ gender: 'neutral', locale, nameCount: 5 } as NameGenerationRequest)
    } catch {
      // fallback silently
    } finally {
      setIsGenerating(false)
    }
  }, [locale])

  const handleComplete = useCallback(
    (res: NameGenerationResponse) => {
      let allNames = res.names
      if (appendingRef.current) {
        allNames = [...savedNamesRef.current, ...res.names]
        appendingRef.current = false
        savedNamesRef.current = []
      }
      persistPreviousNames([...previousNamesRef.current, ...allNames])
      setResponse({ ...res, names: allNames })
      setIsGenerating(false)
    },
    [persistPreviousNames],
  )

  const handleRegenerate = useCallback(() => {
    if (request) {
      appendingRef.current = false
      savedNamesRef.current = []
      const enriched = { ...request, previousNames: previousNamesRef.current }
      setRequest(enriched)
      setResponse(null)
      setIsGenerating(true)
    }
  }, [request])

  const handleGenerateMore = useCallback(() => {
    if (request) {
      savedNamesRef.current = response?.names || []
      appendingRef.current = true
      const enriched = {
        ...request,
        previousNames: previousNamesRef.current,
        appendResults: true,
      }
      setRequest(enriched)
      setResponse(null)
      setIsGenerating(true)
    }
  }, [request, response])

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">☯</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
              FengShuiMing
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <UserMenu onRestartTour={handleRestartTour} />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <section className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            {t.hero?.title ?? (locale === 'zh' ? '风水起名' : 'Đặt tên phong thủy')}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t.hero?.subtitle ??
              (locale === 'zh'
                ? '生成具有传统风水分析的亚洲婴儿名字'
                : 'Tạo tên em bé châu Á với phân tích phong thủy truyền thống')}
          </p>
        </section>

        <section className="mb-10">
          <NameForm onSubmit={handleSubmit} onRandom={handleRandom} isLoading={isGenerating} />
        </section>

        {request && (
          <section className="mb-10" data-tour="results">
            <ResultsContainer
              request={request}
              onComplete={handleComplete}
              onRegenerate={handleRegenerate}
              onGenerateMore={handleGenerateMore}
              isRegenerating={isGenerating}
              initialResponse={response || undefined}
            />
          </section>
        )}

        <section className="mt-12">
          <FavoritesList />
        </section>
      </div>
    </main>
  )
}
