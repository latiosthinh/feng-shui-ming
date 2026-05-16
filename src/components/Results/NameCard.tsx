'use client'
import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/hooks'
import type { GeneratedName } from '@/lib/agent/types'
import type { FengShuiAnalysis, AuspiciousnessScore } from '@/lib/fengshui/types'
import { NameCardHeader } from './NameCardHeader'
import { NameCardNickname } from './NameCardNickname'
import { useFavorites } from '@/lib/favorites/hooks'
import type { FavoriteEntry } from '@/lib/favorites/types'
import dynamic from 'next/dynamic'

const AnalysisModal = dynamic(
  () => import('./AnalysisModal').then((m) => ({ default: m.AnalysisModal })),
  { ssr: false },
)

interface NameCardProps {
  name: GeneratedName
  analysis: FengShuiAnalysis
  surname?: string
  birthDate?: string
  birthTime?: string
}

const LABELS = {
  zh: [
    {
      type: 'fengshui' as const,
      label: '风水',
      emoji: '☯',
      color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    },
    {
      type: 'numerology' as const,
      label: '命理',
      emoji: '🔢',
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    },
    {
      type: 'bazi' as const,
      label: '八字',
      emoji: '📅',
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    },
    {
      type: 'horoscope' as const,
      label: '星座',
      emoji: '⭐',
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    },
  ],
  vi: [
    {
      type: 'fengshui' as const,
      label: 'Phong thủy',
      emoji: '☯',
      color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    },
    {
      type: 'numerology' as const,
      label: 'Mệnh lý',
      emoji: '🔢',
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    },
    {
      type: 'bazi' as const,
      label: 'Bát tự',
      emoji: '📅',
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    },
    {
      type: 'horoscope' as const,
      label: 'Cung & Giáp',
      emoji: '⭐',
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    },
  ],
  ja: [],
  ko: [],
}

export function NameCard({ name, analysis, surname, birthDate, birthTime }: NameCardProps) {
  const { locale } = useTranslation()
  const { add, remove, isFav, limitReached, setLimitReached } = useFavorites()
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const buttons = LABELS[locale] || LABELS.zh
  const auspiciousness: AuspiciousnessScore | undefined = analysis.auspiciousness

  const AUSPICIOUS_LABELS: Record<string, Record<string, { label: string; color: string }>> = {
    zh: {
      excellent: { label: '大吉', color: 'bg-green-100 text-green-800 border-green-300' },
      good: { label: '吉', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      fair: { label: '平', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      poor: { label: '凶', color: 'bg-red-100 text-red-800 border-red-300' },
    },
    vi: {
      excellent: { label: 'Đại cát', color: 'bg-green-100 text-green-800 border-green-300' },
      good: { label: 'Cát', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      fair: { label: 'Bình', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      poor: { label: 'Hung', color: 'bg-red-100 text-red-800 border-red-300' },
    },
  }

  const handleToggleFavorite = () => {
    const id = `${name.native}-${name.romanization}`
    if (isFav(id)) {
      remove(id)
    } else {
      const entry: FavoriteEntry = {
        id,
        name,
        analysis,
        nickname: name.nickname || '',
        savedAt: new Date().toISOString(),
        locale,
      }
      const ok = add(entry)
      if (!ok) {
        const msg = locale === 'vi' ? 'Đã đạt tối đa 50 mục yêu thích' : '已达50个收藏上限'
        setToast(msg)
        setTimeout(() => setToast(null), 3000)
      }
    }
  }

  useEffect(() => {
    if (limitReached) {
      const msg = locale === 'vi' ? 'Đã đạt tối đa 50 mục yêu thích' : '已达50个收藏上限'
      setToast(msg)
      setTimeout(() => setToast(null), 3000)
      setLimitReached(false)
    }
  }, [limitReached, locale, setLimitReached])

  const id = `${name.native}-${name.romanization}`
  const favorited = isFav(id)

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <NameCardHeader name={name} />
              {auspiciousness &&
                (() => {
                  const badge = (AUSPICIOUS_LABELS[locale] || AUSPICIOUS_LABELS.zh)[
                    auspiciousness.rating
                  ]
                  return (
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded border text-xs font-medium ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  )
                })()}
            </div>
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-full transition-colors ${
                favorited
                  ? 'text-red-500 bg-red-50'
                  : 'text-gray-400 hover:text-red-400 hover:bg-red-50'
              }`}
              aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                className="w-5 h-5"
                fill={favorited ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-600 leading-relaxed">{name.meaning}</p>
            {name.culturalSignificance && (
              <p className="text-xs text-gray-400">{name.culturalSignificance}</p>
            )}
          </div>

          <NameCardNickname nickname={name.nickname || ''} />

          <div className="pt-2 border-t border-gray-100">
            <div className="flex flex-wrap gap-1.5">
              {buttons.map((btn) => (
                <button
                  key={btn.type}
                  type="button"
                  onClick={() => setShowAnalysis(true)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${btn.color}`}
                >
                  <span className="mr-1">{btn.emoji}</span>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAnalysis && (
        <AnalysisModal
          name={name.native}
          surname={surname || ''}
          birthDate={birthDate}
          birthTime={birthTime}
          onClose={() => setShowAnalysis(false)}
        />
      )}
    </>
  )
}
