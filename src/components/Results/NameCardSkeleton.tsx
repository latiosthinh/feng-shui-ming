'use client'

interface NameCardSkeletonProps {
  phase?: 'skeleton' | 'seed'
}

export function NameCardSkeleton({ phase = 'skeleton' }: NameCardSkeletonProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div
            className={`h-7 w-32 rounded ${phase === 'seed' ? 'bg-gray-200' : 'bg-gray-200 motion-safe:animate-shimmer'}`}
          />
          <div
            className={`h-4 w-24 rounded ${phase === 'seed' ? 'bg-gray-100' : 'bg-gray-100 motion-safe:animate-shimmer'}`}
          />
        </div>
        <div
          className={`h-8 w-8 rounded-full ${phase === 'seed' ? 'bg-gray-200' : 'bg-gray-200 motion-safe:animate-shimmer'}`}
        />
      </div>
      <div className="space-y-2">
        <div
          className={`h-4 w-full rounded ${phase === 'seed' ? 'bg-gray-100' : 'bg-gray-100 motion-safe:animate-shimmer'}`}
        />
        <div
          className={`h-4 w-3/4 rounded ${phase === 'seed' ? 'bg-gray-100' : 'bg-gray-100 motion-safe:animate-shimmer'}`}
        />
      </div>
      <div
        className={`h-6 w-20 rounded-full ${phase === 'seed' ? 'bg-gray-100' : 'bg-gray-100 motion-safe:animate-shimmer'}`}
      />
      <div className="pt-2 border-t border-gray-100">
        <div className="flex flex-wrap gap-1.5">
          <div
            className={`h-7 w-16 rounded-lg ${phase === 'seed' ? 'bg-gray-100' : 'bg-gray-100 motion-safe:animate-shimmer'}`}
          />
          <div
            className={`h-7 w-16 rounded-lg ${phase === 'seed' ? 'bg-gray-100' : 'bg-gray-100 motion-safe:animate-shimmer'}`}
          />
          <div
            className={`h-7 w-16 rounded-lg ${phase === 'seed' ? 'bg-gray-100' : 'bg-gray-100 motion-safe:animate-shimmer'}`}
          />
        </div>
      </div>
    </div>
  )
}
