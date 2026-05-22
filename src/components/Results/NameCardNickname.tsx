'use client'
import { useTranslation } from '@/lib/i18n/hooks'

interface NameCardNicknameProps {
  nickname: string
  nicknameSuggestions?: string[]
}

export function NameCardNickname({ nickname, nicknameSuggestions }: NameCardNicknameProps) {
  const { t } = useTranslation()

  const allNicknames = [nickname, ...(nicknameSuggestions || [])].filter(Boolean)

  if (allNicknames.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3">
      <h5 className="text-xs font-semibold text-pink-600 mb-2">{t.results.nickname}</h5>
      <div className="flex flex-wrap gap-1.5">
        {allNicknames.map((n, i) => (
          <span key={i} className="px-2.5 py-1 bg-white/70 rounded-full text-sm font-medium text-pink-700 border border-pink-200">
            {n}
          </span>
        ))}
      </div>
    </div>
  )
}
