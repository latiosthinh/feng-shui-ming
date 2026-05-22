'use client'
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/hooks'
import type { FavoriteEntry } from '@/lib/favorites/types'
import { createShareShortlistAction } from '@/lib/share/actions'

interface ShareShortlistModalProps {
  favorites: FavoriteEntry[]
  onClose: () => void
}

export function ShareShortlistModal({ favorites, onClose }: ShareShortlistModalProps) {
  const { t, locale } = useTranslation()
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const names = favorites.map((f) => ({
        name: f.name,
        nickname: f.nickname,
      }))
      const data = await createShareShortlistAction(names, locale)
      const shareUrl = `${window.location.origin}/share/${data.token}`
      setUrl(shareUrl)
    } catch {
      // fallback silently
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">{t.share.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600">
          {favorites.length} tên đã chọn. Ông bà có thể xem và thích mà không cần tài khoản.
        </p>

        {!url ? (
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Đang tạo...' : '🔗 Tạo liên kết chia sẻ'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={url}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors cursor-pointer"
              >
                {copied ? t.share.copied : t.share.copyLink}
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Gửi liên kết này cho ông bà, người thân để họ bình chọn!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
