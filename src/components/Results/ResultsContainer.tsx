'use client'
import type { NameGenerationRequest, NameGenerationResponse } from '@/lib/agent/types'
import { StreamingResults } from './StreamingResults'

interface ResultsContainerProps {
  request: NameGenerationRequest
  onComplete: (response: NameGenerationResponse) => void
  onRegenerate: () => void
  onGenerateMore: () => void
  isRegenerating: boolean
  initialResponse?: NameGenerationResponse
}

export function ResultsContainer({
  request,
  onComplete,
  onRegenerate,
  onGenerateMore,
  isRegenerating,
  initialResponse,
}: ResultsContainerProps) {
  return (
    <StreamingResults
      request={request}
      onComplete={onComplete}
      onRegenerate={onRegenerate}
      onGenerateMore={onGenerateMore}
      isRegenerating={isRegenerating}
      initialResponse={initialResponse}
    />
  )
}
