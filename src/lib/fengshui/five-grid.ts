import type { FiveGridScore } from './types'
import { getStrokeCount } from './stroke-data'

// Auspicious numbers according to 81-number theory (吉数)
const auspiciousNumbers = new Set([
  1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25, 29, 31, 32, 33, 35, 37, 39, 41, 45, 47,
  48, 52, 57, 61, 63, 65, 67, 68, 81,
])

// Inauspicious numbers (凶数)
const inauspiciousNumbers = new Set([
  2, 4, 9, 10, 12, 14, 19, 20, 22, 26, 27, 28, 30, 34, 36, 40, 42, 43, 44, 46, 49, 50, 51, 53, 54,
  55, 56, 58, 59, 60, 62, 64, 66, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
])

function evaluateScore(score: number): 'auspicious' | 'neutral' | 'inauspicious' {
  if (auspiciousNumbers.has(score)) return 'auspicious'
  if (inauspiciousNumbers.has(score)) return 'inauspicious'
  return 'neutral'
}

export function calculateFiveGrid(surname: string, givenName: string): FiveGridScore {
  const surnameStrokes = surname.split('').reduce((sum, c) => {
    const s = getStrokeCount(c)
    return s > 0 ? sum + s : sum
  }, 0)

  const givenNameChars = givenName.split('')
  const givenNameStrokes = givenNameChars.map((c) => getStrokeCount(c)).filter((s) => s > 0)

  const firstGivenStroke = givenNameStrokes[0] || 0
  const totalGivenStrokes = givenNameStrokes.reduce((a, b) => a + b, 0)
  const totalStrokes = surnameStrokes + totalGivenStrokes

  // 天格 (Heaven): surname strokes + 1
  const tianGe = surnameStrokes + 1
  // 人格 (Person): surname strokes + first given name character strokes
  const renGe = surnameStrokes + firstGivenStroke
  // 地格 (Earth): sum of all given name character strokes
  const diGe = totalGivenStrokes
  // 外格 (Outer): total strokes - renGe + 1
  const waiGe = totalStrokes - renGe + 1
  // 总格 (Total): sum of all character strokes
  const zongGe = totalStrokes

  // Overall evaluation: weighted by importance (人格 and 总格 are most important)
  const scores = [tianGe, renGe, diGe, waiGe, zongGe]
  const evaluations = scores.map(evaluateScore)

  // Count auspicious vs inauspicious
  const auspiciousCount = evaluations.filter((e) => e === 'auspicious').length
  const inauspiciousCount = evaluations.filter((e) => e === 'inauspicious').length

  // 人格 and 总格 carry more weight
  const renGeEval = evaluateScore(renGe)
  const zongGeEval = evaluateScore(zongGe)

  let overall: 'auspicious' | 'neutral' | 'inauspicious'
  if (renGeEval === 'inauspicious' || zongGeEval === 'inauspicious') {
    overall = inauspiciousCount >= 2 ? 'inauspicious' : 'neutral'
  } else if (auspiciousCount >= 3) {
    overall = 'auspicious'
  } else if (inauspiciousCount >= 3) {
    overall = 'inauspicious'
  } else {
    overall = 'neutral'
  }

  return { tianGe, renGe, diGe, waiGe, zongGe, overall }
}
