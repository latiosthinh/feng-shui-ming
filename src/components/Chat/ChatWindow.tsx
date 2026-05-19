'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/hooks'
import { useAuth } from '@/lib/auth/context'
import { useFavorites } from '@/lib/favorites/hooks'
import { getLimits } from '@/lib/auth/types'
import type { FavoriteEntry } from '@/lib/favorites/types'
import type { FengShuiAnalysis } from '@/lib/fengshui/types'
import { ChatMessage } from './ChatMessage'
import dynamic from 'next/dynamic'

const AnalysisModal = dynamic(
  () => import('@/components/Results/AnalysisModal').then((m) => ({ default: m.AnalysisModal })),
  { ssr: false },
)

const SUGGESTED_PROMPTS = [
  'Gợi ý tên cho bé trai họ Nguyễn, mong muốn thông minh và tài giỏi',
  'Tên cho bé gái sinh năm 2024, hợp phong thủy',
  'Tên có ý nghĩa về trí tuệ và thành công',
]

interface ChatWindowProps {
  isOpen: boolean
  onClose: () => void
  fullScreen?: boolean
}

interface ChatMessageData {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  names?: Array<{
    native: string
    romanization: string
    hanzi?: string
    meaning: string
    culturalSignificance: string
    nickname?: string
  }>
  timestamp: number
}

export type { ChatMessageData as Message }

export function ChatWindow({ isOpen, onClose, fullScreen }: ChatWindowProps) {
  const { t, locale } = useTranslation()
  const { user, fingerprint } = useAuth()
  const { add } = useFavorites()
  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        locale === 'zh'
          ? '你好！我是风水起名助手。请告诉我你想要的名字风格、含义或其他偏好。'
          : 'Chào bạn! Tôi là trợ lý đặt tên phong thủy. Hãy cho tôi biết bạn muốn tên có ý nghĩa gì, phong cách ra sao, hoặc bất kỳ sở thích nào.',
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [analysisName, setAnalysisName] = useState<{ native: string; surname: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const limits = getLimits(user?.tier || 'free', !user)
  const remaining = limits.chatNames - (user?.totalChatNames || 0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSaveFavorite = useCallback(
    async (name: ChatMessageData['names'][number]) => {
      const id = `${name.native}-${name.romanization}`
      const entry: FavoriteEntry = {
        id,
        name: {
          native: name.native,
          romanization: name.romanization,
          hanzi: name.hanzi,
          meaning: name.meaning,
          culturalSignificance: name.culturalSignificance,
          nickname: name.nickname,
        },
        analysis: {
          fiveGrid: { tianGe: 0, renGe: 0, diGe: 0, waiGe: 0, zongGe: 0, overall: 'neutral' },
          wuXing: [],
          recommendations: [],
        },
        nickname: name.nickname || '',
        savedAt: new Date().toISOString(),
        locale,
      }
      await add(entry)
    },
    [add, locale],
  )

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating) return

    const userMessage: ChatMessageData = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsGenerating(true)

    try {
      const res = await fetch('/api/chat-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fingerprint': fingerprint,
        },
        body: JSON.stringify({
          message: input.trim(),
          userId: user?.id,
          locale,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error || 'Request failed')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const names: ChatMessageData['names'] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const msg = JSON.parse(line)
            if (msg.type === 'name') {
              names.push(msg.name)
            }
          } catch {}
        }
      }

      const assistantMessage: ChatMessageData = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          names.length > 0
            ? `Đã tạo ${names.length} tên cho bạn:`
            : 'Xin lỗi, tôi chỉ có thể hỗ trợ đặt tên phong thủy.',
        names: names.length > 0 ? names : undefined,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMsg: ChatMessageData = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: err instanceof Error ? err.message : 'Có lỗi xảy ra',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsGenerating(false)
    }
  }, [input, isGenerating, user, fingerprint, locale])

  const handleSuggestedPrompt = useCallback((prompt: string) => {
    setInput(prompt)
  }, [])

  if (!isOpen) return null

  const containerClass = fullScreen
    ? 'h-full flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200'
    : 'fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] h-[32rem] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col'

  return (
    <>
      <div className={containerClass}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800">Trò chuyện起名</h3>
            {!fullScreen && (
              <p className="text-xs text-gray-400">Còn lại: {remaining} tên</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto p-4 space-y-3"
          data-tour="chat-names"
        >
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onSaveFavorite={handleSaveFavorite}
              onAnalyze={(n) => setAnalysisName({ native: n.native, surname: '' })}
            />
          ))}
          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              Đang tạo tên...
            </div>
          )}

          {/* Suggested prompts */}
          {messages.length <= 2 && !isGenerating && (
            <div data-tour="chat-suggestions" className="pt-2 space-y-2">
              <p className="text-xs text-gray-400 text-center">Gợi ý nhanh:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 text-xs font-medium hover:bg-purple-100 transition-colors cursor-pointer border border-purple-200"
                  >
                    {prompt.length > 40 ? prompt.slice(0, 40) + '...' : prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Mô tả tên bạn muốn..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-purple-400"
              disabled={isGenerating}
              data-tour="chat-input"
            />
            <button
              onClick={handleSend}
              disabled={isGenerating || !input.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
              data-tour="chat-send"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>

      {analysisName && (
        <AnalysisModal
          name={analysisName.native}
          surname={analysisName.surname}
          onClose={() => setAnalysisName(null)}
        />
      )}
    </>
  )
}
