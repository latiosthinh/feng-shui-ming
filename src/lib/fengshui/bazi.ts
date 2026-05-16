import type { BaziInfo, WuXingElement } from './types'

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
const EARTHLY_BRANCHES = [
  '子',
  '丑',
  '寅',
  '卯',
  '辰',
  '巳',
  '午',
  '未',
  '申',
  '酉',
  '戌',
  '亥',
] as const

const STEM_ELEMENT: WuXingElement[] = [
  'wood',
  'wood',
  'fire',
  'fire',
  'earth',
  'earth',
  'metal',
  'metal',
  'water',
  'water',
]
const BRANCH_ELEMENT: WuXingElement[] = [
  'water',
  'earth',
  'wood',
  'wood',
  'earth',
  'fire',
  'fire',
  'earth',
  'metal',
  'metal',
  'earth',
  'water',
]

const HOUR_BRANCH_MAP: Record<number, number> = {
  23: 0,
  0: 0,
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
  6: 3,
  7: 4,
  8: 4,
  9: 5,
  10: 5,
  11: 6,
  12: 6,
  13: 7,
  14: 7,
  15: 8,
  16: 8,
  17: 9,
  18: 9,
  19: 10,
  20: 10,
  21: 11,
  22: 11,
}

// Reference: Jan 1, 1900 = day stem index 0 (甲子)
const REFERENCE_DATE = new Date(1900, 0, 1)
const REFERENCE_DAY_STEM = 0
const REFERENCE_DAY_BRANCH = 0

function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime()
  return Math.round(ms / 86400000)
}

function dayPillarIndex(date: Date): { stem: number; branch: number } {
  const diff = daysBetween(date, REFERENCE_DATE)
  const stem = (((REFERENCE_DAY_STEM + diff) % 10) + 10) % 10
  const branch = (((REFERENCE_DAY_BRANCH + diff) % 12) + 12) % 12
  return { stem, branch }
}

function monthPillarIndex(yearStem: number, month: number): { stem: number; branch: number } {
  // Month branch: 寅=1, 卯=2, ..., 丑=12
  const branch = (month + 1) % 12
  // Month stem = (yearStem % 5 * 2 + monthIndex) % 10
  const stem = ((yearStem % 5) * 2 + month) % 10
  return { stem, branch }
}

function hourPillarIndex(dayStem: number, hour: number): { stem: number; branch: number } {
  const branch = HOUR_BRANCH_MAP[hour] ?? 0
  const stem = ((dayStem % 5) * 2 + branch) % 10
  return { stem, branch }
}

export function calculateBazi(birthDate: Date, birthTime?: string): BaziInfo {
  const year = birthDate.getFullYear()
  const month = birthDate.getMonth() + 1
  const day = birthDate.getDate()
  const hour = birthTime ? parseInt(birthTime.split(':')[0] || '12', 10) : 12

  // Year pillar
  const yearStemIndex = (((year - 4) % 10) + 10) % 10
  const yearBranchIndex = (((year - 4) % 12) + 12) % 12

  // Month pillar
  const monthPillar = monthPillarIndex(yearStemIndex, month)

  // Day pillar
  const dayPillar = dayPillarIndex(new Date(year, month - 1, day))

  // Hour pillar
  const hourPillar = hourPillarIndex(dayPillar.stem, hour)

  const pillars = [
    { stem: yearStemIndex, branch: yearBranchIndex, label: 'year' as const },
    { stem: monthPillar.stem, branch: monthPillar.branch, label: 'month' as const },
    { stem: dayPillar.stem, branch: dayPillar.branch, label: 'day' as const },
    { stem: hourPillar.stem, branch: hourPillar.branch, label: 'hour' as const },
  ]

  const elements: WuXingElement[] = []
  for (const p of pillars) {
    elements.push(STEM_ELEMENT[p.stem])
    elements.push(BRANCH_ELEMENT[p.branch])
  }

  const allElements: WuXingElement[] = ['wood', 'fire', 'earth', 'metal', 'water']
  const counts: Record<WuXingElement, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  for (const el of elements) {
    counts[el]++
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

  return {
    year: {
      heavenlyStem: HEAVENLY_STEMS[yearStemIndex],
      earthlyBranch: EARTHLY_BRANCHES[yearBranchIndex],
      element: STEM_ELEMENT[yearStemIndex],
    },
    month: {
      heavenlyStem: HEAVENLY_STEMS[monthPillar.stem],
      earthlyBranch: EARTHLY_BRANCHES[monthPillar.branch],
      element: STEM_ELEMENT[monthPillar.stem],
    },
    day: {
      heavenlyStem: HEAVENLY_STEMS[dayPillar.stem],
      earthlyBranch: EARTHLY_BRANCHES[dayPillar.branch],
      element: STEM_ELEMENT[dayPillar.stem],
    },
    hour: {
      heavenlyStem: HEAVENLY_STEMS[hourPillar.stem],
      earthlyBranch: EARTHLY_BRANCHES[hourPillar.branch],
      element: STEM_ELEMENT[hourPillar.stem],
    },
    missingElements: missing,
    dominantElement: dominant,
  }
}
