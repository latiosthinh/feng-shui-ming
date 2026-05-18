'use client'
import { useState, useEffect } from 'react'
import { analyzeNameAction } from '@/lib/agent/actions/analyze-name'
import { getCachedAnalysis, setCachedAnalysis } from '@/lib/agent/analysis-cache'
import type { AnalysisType, NameAnalysis } from '@/lib/agent/types'
import { useTranslation } from '@/lib/i18n/hooks'

interface AnalysisModalProps {
  name: string
  surname: string
  birthDate?: string
  birthTime?: string
  onClose: () => void
}

const ANALYSIS_TYPES: AnalysisType[] = ['fengshui', 'numerology', 'bazi', 'horoscope']

export function AnalysisModal({
  name,
  surname,
  birthDate,
  birthTime,
  onClose,
}: AnalysisModalProps) {
  const { t, locale } = useTranslation()
  const [activeType, setActiveType] = useState<AnalysisType>('fengshui')
  const [results, setResults] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState<AnalysisType | null>(null)

  const ANALYSIS_INFO: Record<AnalysisType, { label: string; emoji: string }> = {
    fengshui: { label: t.analysis.fengshui, emoji: '☯' },
    numerology: { label: t.analysis.numerology, emoji: '🔢' },
    bazi: { label: t.analysis.bazi, emoji: '📅' },
    horoscope: { label: t.analysis.horoscope, emoji: '⭐' },
  }

  useEffect(() => {
    const cached: Record<string, string | null> = {}
    for (const type of ANALYSIS_TYPES) {
      const entry = getCachedAnalysis(name, surname, type)
      cached[type] = entry?.result || null
    }
    setResults(cached)
  }, [name, surname])

  const runAnalysis = async (type: AnalysisType) => {
    if (results[type] || loading) return
    setLoading(type)
    try {
      const result = await analyzeNameAction(name, surname, type, birthDate, birthTime, locale)
      const entry: NameAnalysis = {
        id: `${name}:${surname}:${type}`,
        type,
        name,
        surname,
        result,
        timestamp: Date.now(),
      }
      setCachedAnalysis(entry)
      setResults((prev) => ({ ...prev, [type]: result }))
    } catch {
      setResults((prev) => ({ ...prev, [type]: t.analysis.failed }))
    } finally {
      setLoading(null)
    }
  }

  const displayName = `${surname}${name}`.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">
            {displayName} - {t.analysis.detail}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex gap-1 px-6 py-3 border-b border-gray-100 overflow-x-auto">
          {ANALYSIS_TYPES.map((type) => {
            const info = ANALYSIS_INFO[type]
            const isActive = activeType === type
            const hasResult = !!results[type]
            const isLoading = loading === type

            return (
              <button
                key={type}
                onClick={() => {
                  setActiveType(type)
                  if (!hasResult && !isLoading) runAnalysis(type)
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-purple-100 text-purple-700'
                    : hasResult
                      ? 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{info.emoji}</span>
                {info.label}
                {hasResult && <span className="text-green-500 text-xs">✓</span>}
                {isLoading && (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading === activeType && (
            <div className="flex items-center gap-3 text-gray-500">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {t.analysis.analyzing}
            </div>
          )}

          {!loading && results[activeType] && (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
              {results[activeType]}
            </div>
          )}

          {!loading && !results[activeType] && (
            <div className="text-center py-8 text-gray-400">{t.analysis.clickToStart}</div>
          )}
        </div>
      </div>
    </div>
  )
}
