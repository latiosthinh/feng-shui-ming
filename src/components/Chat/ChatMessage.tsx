'use client'

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

interface ChatMessageProps {
  message: ChatMessageData
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="text-center text-xs text-red-400 bg-red-50 py-1 px-3 rounded-full mx-auto max-w-xs">
        {message.content}
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-purple-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {message.names && message.names.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.names.map((name, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-xs ${
                  isUser ? 'bg-purple-500/30' : 'bg-white/80'
                }`}
              >
                <p className="font-bold">{name.native}</p>
                {name.romanization && <p className="opacity-70">{name.romanization}</p>}
                {name.meaning && <p className="opacity-70">{name.meaning}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
