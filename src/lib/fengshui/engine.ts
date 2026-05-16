import 'server-only'
import type { FengShuiAnalysis, WuXingElement } from './types'
import { calculateFiveGrid } from './five-grid'
import { calculateBazi } from './bazi'
import { getStrokeCount } from './stroke-data'
import { getWuXingElement, analyzeWuXingBalance } from './wuxing'
import { scoreAuspiciousness } from './auspiciousness'

export interface AnalyzeNameOptions {
  surname: string
  givenName: string
  birthDate?: Date
  birthTime?: string
}

export function analyzeName(options: AnalyzeNameOptions): FengShuiAnalysis {
  const { surname, givenName, birthDate, birthTime } = options

  const fiveGrid = calculateFiveGrid(surname, givenName)

  const strokes = givenName
    .split('')
    .map((c) => getStrokeCount(c))
    .filter((s) => s > 0)

  const wuxingElements: WuXingElement[] = strokes.map((s: number) => getWuXingElement(s))
  const wuxingBalance = analyzeWuXingBalance(wuxingElements)

  let bazi = undefined
  if (birthDate) {
    bazi = calculateBazi(birthDate, birthTime)
  }

  const auspiciousness = scoreAuspiciousness(fiveGrid, wuxingBalance)

  const recommendations: string[] = []
  if (wuxingBalance.missing.length > 0) {
    recommendations.push(`五行缺: ${wuxingBalance.missing.join('、')}`)
  }
  if (fiveGrid.overall === 'inauspicious') {
    recommendations.push('五格评分较低，建议调整用字')
  }
  if (auspiciousness.rating === 'excellent' || auspiciousness.rating === 'good') {
    recommendations.push('整体搭配吉利')
  }

  return {
    fiveGrid,
    wuXing: wuxingElements,
    bazi,
    recommendations,
    auspiciousness,
  }
}
