'use client'
import { LanguageSelector } from '@/components/LanguageSelector'
import { NameForm } from '@/components/NameForm'
import { ResultsContainer } from '@/components/Results/ResultsContainer'
import { FavoritesList } from '@/components/Results/FavoritesList'
import { UserMenu } from '@/components/Auth/UserMenu'
import { ChatWindow } from '@/components/Chat/ChatWindow'
import { Gate } from '@/components/Gate/Gate'
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
  const [showGate, setShowGate] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      return localStorage.getItem('fengshuiming-gate-completed') !== 'true'
    } catch {
      return true
    }
  })
  const [uiMode, setUiMode] = useState<'form' | 'chat'>('form')
  const [request, setRequest] = useState<NameGenerationRequest | null>(null)
  const [response, setResponse] = useState<NameGenerationResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const previousNamesRef = useRef<GeneratedName[]>(loadPreviousNames())
  const appendingRef = useRef(false)
  const savedNamesRef = useRef<GeneratedName[]>([])

  const persistPreviousNames = useCallback((names: GeneratedName[]) => {
    previousNamesRef.current = names
    savePreviousNames(names)
  }, [])

  const handleGateSelect = useCallback((mode: 'form' | 'chat') => {
    setUiMode(mode)
    setShowGate(false)
    try {
      localStorage.setItem('fengshuiming-gate-completed', 'true')
    } catch {}
  }, [])

  const prevUiModeRef = useRef(uiMode)
  const tourStartedRef = useRef(false)
  useEffect(() => {
    if (!showGate && !tourStartedRef.current) {
      tourStartedRef.current = true
      if (!hasCompletedTour()) {
        setTimeout(() => startTour(uiMode), 1000)
      }
    }
  }, [showGate, uiMode, hasCompletedTour, startTour])

  const isFirstChatOpenRef = useRef(true)
  const handleToggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev)
  }, [])

  const handleRestartTour = useCallback(() => {
    resetTour()
    setTimeout(() => startTour(uiMode), 500)
  }, [resetTour, startTour, uiMode])

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
    <>
      {showGate && <Gate onSelect={handleGateSelect} />}

      {!showGate && (
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
            <button
              onClick={() => setUiMode(uiMode === 'form' ? 'chat' : 'form')}
              className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-sm cursor-pointer"
              title={uiMode === 'form' ? 'Chuyển sang trò chuyện' : 'Chuyển sang biểu mẫu'}
            >
              {uiMode === 'form' ? '💬' : '📝'}
            </button>
            <LanguageSelector />
            <UserMenu onRestartTour={handleRestartTour} />
          </div>
        </div>
      </header>

      {uiMode === 'form' ? (
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
      ) : (
      <div className="h-[calc(100vh-57px)]">
        <ChatWindow
          isOpen={true}
          onClose={() => setUiMode('form')}
          fullScreen
        />
      </div>
      )}

      {uiMode === 'form' && (
        <>
      <button
        onClick={handleToggleChat}
        className="fixed bottom-4 right-4 z-40 w-12 h-12 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors flex items-center justify-center cursor-pointer"
        aria-label="Open chat"
        data-tour="chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {isChatOpen && <ChatWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />}
        </>
      )}
    </main>
      )}
    </>
  )
}
