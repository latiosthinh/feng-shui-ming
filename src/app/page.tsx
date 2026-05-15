"use client"
import { LanguageSelector } from "@/components/LanguageSelector";
import { NameForm } from "@/components/NameForm";
import { ResultsContainer } from "@/components/Results/ResultsContainer";
import { FavoritesList } from "@/components/Results/FavoritesList";
import { useState, useCallback } from "react";
import type { NameGenerationRequest, NameGenerationResponse } from "@/lib/agent/types";
import { getRandomNamesAction } from "@/lib/agent/actions/random-names";

export default function Home() {
  const [request, setRequest] = useState<NameGenerationRequest | null>(null);
  const [response, setResponse] = useState<NameGenerationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = useCallback((req: NameGenerationRequest) => {
    setRequest(req);
    setResponse(null);
    setIsGenerating(true);
  }, []);

  const handleRandom = useCallback(async () => {
    setResponse(null);
    setIsGenerating(true);
    try {
      const res = await getRandomNamesAction(undefined, 5, "neutral", "zh");
      setResponse(res);
      setRequest({ gender: "neutral", locale: "zh", nameCount: 5 } as NameGenerationRequest);
    } catch {
      // fallback silently
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleComplete = useCallback((res: NameGenerationResponse) => {
    setResponse(res);
    setIsGenerating(false);
  }, []);

  const handleRegenerate = useCallback(() => {
    if (request) {
      setResponse(null);
      setIsGenerating(true);
    }
  }, [request]);

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">☯</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
              FengShuiMing
            </h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <section className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            风水起名
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Generate meaningful Asian baby names with traditional Feng Shui analysis
          </p>
        </section>

        <section className="mb-10">
          <NameForm onSubmit={handleSubmit} onRandom={handleRandom} isLoading={isGenerating} />
        </section>

        {isGenerating && request && (
          <section className="mb-10">
            <ResultsContainer
              request={request}
              onComplete={handleComplete}
              onRegenerate={handleRegenerate}
              isRegenerating={isGenerating}
            />
          </section>
        )}

        {response && !isGenerating && (
          <section className="mb-10">
            <ResultsContainer
              request={request!}
              onComplete={handleComplete}
              onRegenerate={handleRegenerate}
              isRegenerating={isGenerating}
              initialResponse={response}
            />
          </section>
        )}

        <section className="mt-12">
          <FavoritesList />
        </section>
      </div>
    </main>
  );
}
