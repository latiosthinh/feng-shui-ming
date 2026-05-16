'use client'

interface NameCardSkeletonProps {
  locale?: string
}

export function NameCardSkeleton({ locale }: NameCardSkeletonProps) {
  const isVi = locale !== 'zh'
  return (
    <div
      className="bg-white rounded-2xl shadow-lg p-6 space-y-4 overflow-hidden"
      role="status"
      aria-label={isVi ? 'Đang tạo tên' : '正在生成名字'}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-7 w-32 rounded bg-gray-200 motion-safe:animate-shimmer" />
          <div className="h-4 w-24 rounded bg-gray-100 motion-safe:animate-shimmer" />
        </div>
        <div className="h-8 w-8 rounded-full bg-gray-200 motion-safe:animate-shimmer" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-gray-100 motion-safe:animate-shimmer" />
        <div className="h-4 w-3/4 rounded bg-gray-100 motion-safe:animate-shimmer" />
      </div>
      <div className="h-6 w-20 rounded-full bg-gray-100 motion-safe:animate-shimmer" />
      <div className="pt-2 border-t border-gray-100">
        <div className="flex flex-wrap gap-1.5">
          <div className="h-7 w-16 rounded-lg bg-gray-100 motion-safe:animate-shimmer" />
          <div className="h-7 w-16 rounded-lg bg-gray-100 motion-safe:animate-shimmer" />
          <div className="h-7 w-16 rounded-lg bg-gray-100 motion-safe:animate-shimmer" />
        </div>
      </div>
    </div>
  )
}