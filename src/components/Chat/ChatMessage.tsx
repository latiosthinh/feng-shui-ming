'use client'
import type { Message } from './ChatWindow'

type NameEntry = NonNullable<Message['names']>[number]

interface ChatMessageProps {
  message: Message
  onSaveFavorite?: (name: NameEntry) => void
  onAnalyze?: (name: NameEntry) => void
}

export function ChatMessage({ message, onSaveFavorite, onAnalyze }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="bg-red-50 text-red-600 text-xs p-2 rounded-lg text-center">
        {message.content}
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800'} rounded-2xl px-4 py-2.5`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">☯</span>
            <span className="text-xs font-semibold text-purple-600">Trợ lý</span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {message.names && message.names.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.names.map((name, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-base text-gray-900">
                      {name.native}
                      {name.hanzi ? ` (${name.hanzi})` : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{name.romanization}</p>
                    <p className="text-xs text-gray-600 mt-1">{name.meaning}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => onSaveFavorite?.(name)}
                      className="p-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors cursor-pointer"
                      title="Lưu vào danh sách yêu thích"
                    >
                      <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onAnalyze?.(name)}
                      className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
                      title="Xem phân tích phong thủy"
                    >
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
