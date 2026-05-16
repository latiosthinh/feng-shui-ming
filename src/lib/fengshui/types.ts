export type WuXingElement = "wood" | "fire" | "earth" | "metal" | "water"

export interface FiveGridScore {
  tianGe: number
  renGe: number
  diGe: number
  waiGe: number
  zongGe: number
  overall: "auspicious" | "neutral" | "inauspicious"
}

export interface BaziInfo {
  year: { heavenlyStem: string; earthlyBranch: string; element: WuXingElement }
  month: { heavenlyStem: string; earthlyBranch: string; element: WuXingElement }
  day: { heavenlyStem: string; earthlyBranch: string; element: WuXingElement }
  hour: { heavenlyStem: string; earthlyBranch: string; element: WuXingElement }
  missingElements: WuXingElement[]
  dominantElement: WuXingElement
}

export interface AuspiciousnessScore {
  rating: "excellent" | "good" | "fair" | "poor"
  score: number
  details: {
    fiveGridScore: number
    wuxingScore: number
    totalScore: number
  }
}

export interface FengShuiAnalysis {
  fiveGrid: FiveGridScore
  wuXing: WuXingElement[]
  bazi?: BaziInfo
  recommendations: string[]
  auspiciousness?: AuspiciousnessScore
}
