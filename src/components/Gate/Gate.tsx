'use client'
import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/hooks'

interface GateProps {
  onSelect: (mode: 'form' | 'chat') => void
}

export function Gate({ onSelect }: GateProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-purple-700 to-amber-600">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-180deg); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes card-enter {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
        }
        .animate-card-enter {
          animation: card-enter 0.6s ease-out forwards;
        }
        .animate-fade-in {
          opacity: 0;
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shimmer-text {
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* Animated background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-purple-700/60 to-amber-600/40 animate-gradient" />

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-amber-400/10 blur-xl animate-float" />
      <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-purple-300/10 blur-xl animate-float-delayed" />
      <div className="absolute bottom-32 left-1/4 w-40 h-40 rounded-full bg-amber-300/10 blur-2xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute bottom-40 right-1/4 w-20 h-20 rounded-full bg-purple-400/10 blur-xl animate-float-delayed" style={{ animationDelay: '-1.5s' }} />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <div
          className={`text-8xl mb-6 transition-all duration-1000 ${
            visible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
          style={{ animation: 'float 4s ease-in-out infinite' }}
        >
          ☯
        </div>

        {/* Title */}
        <h1
          className={`text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-purple-200 mb-4 animate-shimmer-text transition-all duration-1000 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          FengShuiMing
        </h1>

        {/* Subtitle */}
        <p
          className={`text-lg md:text-xl text-purple-200/80 mb-12 text-center max-w-lg transition-all duration-1000 delay-200 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          Công cụ đặt tên phong thủy thông minh cho bé yêu của bạn
        </p>

        {/* Mode Cards */}
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
          {/* Form Mode Card */}
          <button
            onClick={() => onSelect('form')}
            className={`flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center hover:bg-white/20 hover:scale-105 hover:shadow-2xl transition-all duration-300 group animate-card-enter ${
              visible ? '' : 'opacity-0'
            }`}
            style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">📝</div>
            <h2 className="text-xl font-bold text-white mb-3">Giao diện biểu mẫu</h2>
            <p className="text-purple-200/70 text-sm leading-relaxed">
              Điền thông tin chi tiết để nhận kết quả phân tích chính xác
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-amber-300 text-sm font-medium">
              Bắt đầu
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Chat Mode Card */}
          <button
            onClick={() => onSelect('chat')}
            className={`flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center hover:bg-white/20 hover:scale-105 hover:shadow-2xl transition-all duration-300 group animate-card-enter ${
              visible ? '' : 'opacity-0'
            }`}
            style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">💬</div>
            <h2 className="text-xl font-bold text-white mb-3">Giao diện trò chuyện</h2>
            <p className="text-purple-200/70 text-sm leading-relaxed">
              Trò chuyện tự nhiên với AI để tìm tên phù hợp
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-amber-300 text-sm font-medium">
              Bắt đầu
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Footer */}
        <p
          className={`mt-12 text-purple-300/50 text-xs transition-all duration-1000 delay-700 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Bạn có thể chuyển đổi giữa hai giao diện bất kỳ lúc nào
        </p>
      </div>
    </div>
  )
}
