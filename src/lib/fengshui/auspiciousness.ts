import type { FiveGridScore } from './types'
import type { WuXingElement } from './types'

export interface AuspiciousnessScore {
  rating: 'excellent' | 'good' | 'fair' | 'poor'
  /** Score in 0–1 range (plan originally specified 0–100; tests lock in 0–1) */
  score: number
  details: {
    fiveGridScore: number
    wuxingScore: number
    totalScore: number
  }
}

const AUSPICIOUS_WEIGHT = 0.6
const WUXING_WEIGHT = 0.4

function scoreFiveGrid(fiveGrid: FiveGridScore): number {
  const classificationScore: Record<string, number> = {
    auspicious: 0.9,
    neutral: 0.5,
    inauspicious: 0.2,
  }
  return classificationScore[fiveGrid.overall] ?? 0.5
}

function scoreWuXing(balance: {
  missing: WuXingElement[]
  dominant: WuXingElement
  counts: Record<WuXingElement, number>
}): number {
  const missingPenalty = balance.missing.length * 0.15
  let score = 1 - missingPenalty

  const totalElements = Object.values(balance.counts).reduce((a, b) => a + b, 0)
  if (totalElements > 0) {
    const dominantRatio = balance.counts[balance.dominant] / totalElements
    if (dominantRatio > 0.5) score -= (dominantRatio - 0.5) * 0.5
  }

  return Math.max(0, Math.min(1, score))
}

export function scoreAuspiciousness(
  fiveGrid: FiveGridScore,
  wuxingBalance?: {
    missing: WuXingElement[]
    dominant: WuXingElement
    counts: Record<WuXingElement, number>
  },
): AuspiciousnessScore {
  const fiveGridScore = scoreFiveGrid(fiveGrid)
  const wuxingScore = wuxingBalance ? scoreWuXing(wuxingBalance) : 0.5

  const totalScore = fiveGridScore * AUSPICIOUS_WEIGHT + wuxingScore * WUXING_WEIGHT

  let rating: 'excellent' | 'good' | 'fair' | 'poor'
  if (totalScore >= 0.8) rating = 'excellent'
  else if (totalScore >= 0.6) rating = 'good'
  else if (totalScore >= 0.4) rating = 'fair'
  else rating = 'poor'

  return {
    rating,
    score: Math.round(totalScore * 100) / 100,
    details: {
      fiveGridScore: Math.round(fiveGridScore * 100) / 100,
      wuxingScore: Math.round(wuxingScore * 100) / 100,
      totalScore: Math.round(totalScore * 100) / 100,
    },
  }
}
