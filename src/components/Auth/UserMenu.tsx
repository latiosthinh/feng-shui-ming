'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import { useTranslation } from '@/lib/i18n/hooks'
import { AuthModal } from './AuthModal'

export function UserMenu() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const [showAuth, setShowAuth] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowAuth(true)}
          className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Đăng nhập
        </button>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
          {user.email.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-gray-700 max-w-32 truncate">{user.email}</span>
        {user.tier === 'paid' && (
          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
            PRO
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-800 truncate">{user.email}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Gói: {user.tier === 'paid' ? 'Trả phí' : 'Miễn phí'}
              </p>
            </div>
            <div className="px-4 py-2 text-xs text-gray-500 space-y-1">
              <p>Tạo tên: {user.totalGenerations}</p>
              <p>Phân tích: {user.totalAnalyzes}</p>
              <p>Chat: {user.totalChatNames} tên</p>
              <p>Yêu thích: {user.totalFavorites}</p>
            </div>
            {user.purchaseCode && (
              <div className="px-4 py-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">Mã thanh toán:</p>
                <p className="text-xs font-mono font-bold text-purple-600">{user.purchaseCode}</p>
              </div>
            )}
            <button
              onClick={() => {
                logout()
                setShowDropdown(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  )
}
