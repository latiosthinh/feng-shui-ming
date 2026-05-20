import 'server-only'
import type { WuXingElement } from './types'

const elementMap: Record<number, WuXingElement> = {
  1: 'wood',
  2: 'wood',
  3: 'fire',
  4: 'fire',
  5: 'earth',
  6: 'earth',
  7: 'metal',
  8: 'metal',
  9: 'water',
  10: 'water',
}

export function getWuXingElement(strokeCount: number): WuXingElement {
  if (strokeCount <= 0) return 'wood'
  const normalized = ((strokeCount - 1) % 10) + 1
  return elementMap[normalized] || 'wood'
}

export function analyzeWuXingBalance(elements: WuXingElement[]): {
  missing: WuXingElement[]
  dominant: WuXingElement
  counts: Record<WuXingElement, number>
} {
  const allElements: WuXingElement[] = ['wood', 'fire', 'earth', 'metal', 'water']
  const counts: Record<WuXingElement, number> = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  }

  for (const el of elements) {
    counts[el] = (counts[el] || 0) + 1
  }

  const missing = allElements.filter((el) => counts[el] === 0)

  let dominant: WuXingElement = 'wood'
  let maxCount = 0
  for (const el of allElements) {
    if (counts[el] > maxCount) {
      maxCount = counts[el]
      dominant = el
    }
  }

  return { missing, dominant, counts }
}
