"use client"
import { useState, useEffect, useRef } from "react"
import { generateNamesAction } from "@/lib/agent/actions/generate-names"
import type { NameGenerationRequest, NameGenerationResponse } from "@/lib/agent/types"
import { NameCard } from "./NameCard"
import { LoadingState } from "./LoadingState"
import { ErrorState } from "./ErrorState"
import { RegenerateButton } from "./RegenerateButton"

interface StreamingResultsProps {
  request: NameGenerationRequest
  onComplete: (response: NameGenerationResponse) => void
  onRegenerate: () => void
  isRegenerating: boolean
  initialResponse?: NameGenerationResponse
}

export function StreamingResults({
  request,
  onComplete,
  onRegenerate,
  isRegenerating,
  initialResponse,
}: StreamingResultsProps) {
  const [response, setResponse] = useState<NameGenerationResponse | null>(initialResponse || null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!initialResponse)

  useEffect(() => {
    if (initialResponse) return

    let cancelled = false
    setLoading(true)

    generateNamesAction(request)
      .then((res) => {
        if (cancelled) return
        setResponse(res)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "生成出错")
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [request, initialResponse])

  const prevResponseRef = useRef(response)
  useEffect(() => {
    if (response && response !== prevResponseRef.current) {
      prevResponseRef.current = response
      onComplete(response)
    }
  }, [response, onComplete])

  if (error) {
    return <ErrorState error={error} onRetry={onRegenerate} />
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <LoadingState message="正在生成名字..." />
      </div>
    )
  }

  if (response) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">生成结果</h3>
          <RegenerateButton onRegenerate={onRegenerate} isLoading={isRegenerating} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {response.names.map((name, index) => (
            <NameCard
              key={index}
              name={name}
              analysis={response.analysis}
              nickname={response.nickname}
              surname={request.surname}
              birthDate={request.birthDate}
              birthTime={request.birthTime}
            />
          ))}
        </div>
      </div>
    )
  }

  return null
}
