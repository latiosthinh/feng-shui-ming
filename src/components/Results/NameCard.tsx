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

const ANALYSIS_TYPES = [
  {
    type: 'fengshui' as const,
    emoji: '☯',
    color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  },
  {
    type: 'numerology' as const,
    emoji: '🔢',
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  {
    type: 'bazi' as const,
    emoji: '📅',
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
  {
    type: 'horoscope' as const,
    emoji: '⭐',
    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  {
    type: 'yijing' as const,
    emoji: '📖',
    color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
  },
]

export function NameCard({ name, analysis, surname, birthDate, birthTime }: NameCardProps) {
  const { t, locale } = useTranslation()
  const { add, remove, isFav, limitReached, setLimitReached } = useFavorites()
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [favorited, setFavorited] = useState(false)
  const buttons = ANALYSIS_TYPES.map((btn) => ({
    ...btn,
    label: t.nameCard[btn.type],
  }))
  const auspiciousness: AuspiciousnessScore | undefined = analysis.auspiciousness

  useEffect(() => {
    const id = `${name.native}-${name.romanization}`
    isFav(id).then(setFavorited)
  }, [name.native, name.romanization, isFav])

  const handleToggleFavorite = async () => {
    const id = `${name.native}-${name.romanization}`
    if (favorited) {
      await remove(id)
      setFavorited(false)
    } else {
      const entry: FavoriteEntry = {
        id,
        name,
        analysis,
        nickname: name.nickname || '',
        savedAt: new Date().toISOString(),
        locale,
      }
      const ok = await add(entry)
      if (!ok) {
        setToast(t.results.maxFavorites)
        setTimeout(() => setToast(null), 3000)
      } else {
        setFavorited(true)
      }
    }
  }

  useEffect(() => {
    if (limitReached) {
      setToast(t.results.maxFavorites)
      setTimeout(() => setToast(null), 3000)
      setLimitReached(false)
    }
  }, [limitReached, setLimitReached])

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all h-full flex flex-col">
        <div className="p-6 flex flex-col flex-1">
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <NameCardHeader name={name} />
                {auspiciousness &&
                  (() => {
                    const badge = t.nameCard[auspiciousness.rating]
                    const badgeConfig = {
                      excellent: {
                        label: badge,
                        color: 'bg-green-100 text-green-800 border-green-300',
                      },
                      good: { label: badge, color: 'bg-blue-100 text-blue-800 border-blue-300' },
                      fair: {
                        label: badge,
                        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                      },
                      poor: { label: badge, color: 'bg-red-100 text-red-800 border-red-300' },
                    }
                    const config = badgeConfig[auspiciousness.rating]
                    return (
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded border text-xs font-medium ${config.color}`}
                      >
                        {config.label}
                      </span>
                    )
                  })()}
              </div>
              <button
                onClick={handleToggleFavorite}
                data-tour="favorite"
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  favorited
                    ? 'text-red-500 bg-red-50'
                    : 'text-gray-400 hover:text-red-400 hover:bg-red-50'
                }`}
                aria-label={favorited ? t.common.removeFavorite : t.common.favorites}
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

            {name.nickname && <NameCardNickname nickname={name.nickname} />}
          </div>

          <div className="pt-2 border-t border-gray-100 mt-auto">
            <div className="flex flex-wrap gap-1.5" data-tour="analysis-buttons">
              {buttons.map((btn) => (
                <button
                  key={btn.type}
                  type="button"
                  onClick={() => setShowAnalysis(true)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${btn.color}`}
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
