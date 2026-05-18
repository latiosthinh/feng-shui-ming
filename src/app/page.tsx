'use client'
import { LanguageSelector } from '@/components/LanguageSelector'
import { NameForm } from '@/components/NameForm'
import { ResultsContainer } from '@/components/Results/ResultsContainer'
import { FavoritesList } from '@/components/Results/FavoritesList'
import { useState, useCallback, useRef } from 'react'
import type {
  NameGenerationRequest,
  NameGenerationResponse,
  GeneratedName,
} from '@/lib/agent/types'
import { getRandomNamesAction } from '@/lib/agent/actions/random-names'
import { useTranslation } from '@/lib/i18n/hooks'

export default function Home() {
  const { locale, t } = useTranslation()
  const [request, setRequest] = useState<NameGenerationRequest | null>(null)
  const [response, setResponse] = useState<NameGenerationResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const previousNamesRef = useRef<GeneratedName[]>([])

  const handleSubmit = useCallback((req: NameGenerationRequest) => {
    previousNamesRef.current = []
    setRequest(req)
    setResponse(null)
    setIsGenerating(true)
  }, [])

  const handleRandom = useCallback(async () => {
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
  }, [])

  const handleComplete = useCallback((res: NameGenerationResponse) => {
    previousNamesRef.current = [...previousNamesRef.current, ...res.names]
    setResponse(res)
    setIsGenerating(false)
  }, [])

  const handleRegenerate = useCallback(() => {
    if (request) {
      const enriched = { ...request, previousNames: previousNamesRef.current }
      setRequest(enriched)
      setResponse(null)
      setIsGenerating(true)
    }
  }, [request])

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
          <LanguageSelector />
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

        {isGenerating && request && (
          <section className="mb-10">
            <ResultsContainer
              request={request}
              onComplete={handleComplete}
              onRegenerate={handleRegenerate}
              isRegenerating={isGenerating}
            />
          </section>
        )}

        {response && !isGenerating && (
          <section className="mb-10">
            <ResultsContainer
              request={request!}
              onComplete={handleComplete}
              onRegenerate={handleRegenerate}
              isRegenerating={isGenerating}
              initialResponse={response}
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
