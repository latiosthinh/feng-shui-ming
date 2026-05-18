'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/hooks'
import { useAuth } from '@/lib/auth/context'
import { getLimits } from '@/lib/auth/types'
import { ChatMessage } from './ChatMessage'

interface ChatWindowProps {
  isOpen: boolean
  onClose: () => void
}

interface ChatMessageData {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  names?: Array<{
    native: string
    romanization: string
    meaning: string
    culturalSignificance: string
    nickname?: string
  }>
  timestamp: number
}

export type { ChatMessageData as Message }

export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
  const { t, locale } = useTranslation()
  const { user, fingerprint } = useAuth()
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const limits = getLimits(user?.tier || 'free', !user)
  const remaining = limits.chatNames - (user?.totalChatNames || 0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
            ? locale === 'zh'
              ? `Đã tạo ${names.length} tên cho bạn:`
              : `Đã tạo ${names.length} tên cho bạn:`
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
  }, [input, isGenerating, user])

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] h-[32rem] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-gray-800">Trò chuyện起名</h3>
          <p className="text-xs text-gray-400">
            Còn lại: {remaining} tên
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
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
          />
          <button
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  )
}
