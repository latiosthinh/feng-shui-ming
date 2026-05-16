'use client'
import { useTranslation } from '@/lib/i18n/hooks'

interface NameCardNicknameProps {
  nickname: string
}

export function NameCardNickname({ nickname }: NameCardNicknameProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3">
      <h5 className="text-xs font-semibold text-pink-600 mb-1">{t.results.nickname}</h5>
      <p className="text-lg font-medium text-pink-700">{nickname}</p>
    </div>
  )
}
