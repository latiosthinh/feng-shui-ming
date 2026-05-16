'use client'
import type { NameGenerationRequest, NameGenerationResponse } from '@/lib/agent/types'
import { StreamingResults } from './StreamingResults'

interface ResultsContainerProps {
  request: NameGenerationRequest
  onComplete: (response: NameGenerationResponse) => void
  onRegenerate: () => void
  isRegenerating: boolean
  initialResponse?: NameGenerationResponse
}

export function ResultsContainer({
  request,
  onComplete,
  onRegenerate,
  isRegenerating,
  initialResponse,
}: ResultsContainerProps) {
  return (
    <StreamingResults
      request={request}
      onComplete={onComplete}
      onRegenerate={onRegenerate}
      isRegenerating={isRegenerating}
      initialResponse={initialResponse}
    />
  )
}
