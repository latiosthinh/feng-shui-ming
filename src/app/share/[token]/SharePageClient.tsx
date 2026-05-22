'use client'
import { useState, useCallback } from 'react'
import type { ShareNameEntry } from '@/lib/share/types'
import type { Locale } from '@/lib/i18n/types'
import { likeNameAction } from '@/lib/share/actions'
import { useAuth } from '@/lib/auth/context'

interface Props {
  token: string
  names: ShareNameEntry[]
  surname?: string
  locale: Locale
  likeCounts: Record<string, number>
}

export function SharePageClient({ token, names, surname, locale, likeCounts }: Props) {
  const { fingerprint } = useAuth()
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [counts, setCounts] = useState(likeCounts)

  const handleLike = useCallback(async (nameIndex: number) => {
    if (liked[nameIndex] || !fingerprint) return
    const result = await likeNameAction(token, nameIndex, fingerprint)
    if (result) {
      setLiked((prev) => ({ ...prev, [nameIndex]: true }))
      setCounts((prev) => ({ ...prev, [nameIndex]: result.count }))
    }
  }, [token, fingerprint, liked])

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <span>☯</span>
            Danh sách tên yêu thích
          </h1>
          {surname && (
            <p className="text-gray-500 mt-1">Họ: {surname}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Hãy 👍 vào các tên bạn thích!
          </p>
        </div>

        <div className="space-y-4">
          {names.map((entry, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-lg p-5 transition-all hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-800">{entry.name.native}</h2>
                    {entry.name.englishName && (
                      <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                        {entry.name.englishName}
                      </span>
                    )}
                  </div>
                  {entry.name.hanzi && (
                    <p className="text-gray-400 text-sm mt-0.5">{entry.name.hanzi}</p>
                  )}
                  <p className="text-gray-600 text-sm mt-2">{entry.name.meaning}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    {entry.nickname && (
                      <span className="px-2 py-0.5 bg-pink-50 text-pink-600 rounded-full">
                        {entry.nickname}
                      </span>
                    )}
                    {entry.name.frequencyTier && (
                      <span className={`px-2 py-0.5 rounded-full ${
                        entry.name.frequencyTier === 'popular' ? 'bg-orange-50 text-orange-700' :
                        entry.name.frequencyTier === 'timeless' ? 'bg-green-50 text-green-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        {entry.name.frequencyTier}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleLike(idx)}
                  disabled={liked[idx]}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    liked[idx]
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                >
                  <span>{liked[idx] ? '👍' : '👍'}</span>
                  <span>{counts[idx] || 0}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Được tạo bởi FengShuiMing — Công cụ đặt tên phong thủy
        </p>
      </div>
    </main>
  )
}
