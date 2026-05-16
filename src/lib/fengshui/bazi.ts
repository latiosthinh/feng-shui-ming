import 'server-only'
import { Solar } from 'lunar-javascript'
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

export function calculateBazi(birthDate: Date, birthTime?: string): BaziInfo {
  const year = birthDate.getFullYear()
  const month = birthDate.getMonth() + 1
  const day = birthDate.getDate()
  const hour = birthTime ? parseInt(birthTime.split(':')[0] || '12', 10) : 12
  const minute = birthTime ? parseInt(birthTime.split(':')[1] || '0', 10) : 0

  // Times interpreted as China Standard Time (CST, UTC+8)
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0)
  const lunar = solar.getLunar()

  // Year pillar: solar-term-aware (立春 boundary)
  const yearStemIndex = lunar.getYearGanIndexByLiChun()
  const yearBranchIndex = lunar.getYearZhiIndexByLiChun()

  // Month pillar: solar-term-based
  const monthStemIndex = lunar.getMonthGanIndex()
  const monthBranchIndex = lunar.getMonthZhiIndex()

  // Day pillar: 60-day cycle from lunar library
  const dayStemIndex = lunar.getDayGanIndex()
  const dayBranchIndex = lunar.getDayZhiIndex()

  // Hour pillar: based on day stem and hour
  const hourStemIndex = lunar.getTimeGanIndex()
  const hourBranchIndex = lunar.getTimeZhiIndex()

  const pillars = [
    { stem: yearStemIndex, branch: yearBranchIndex },
    { stem: monthStemIndex, branch: monthBranchIndex },
    { stem: dayStemIndex, branch: dayBranchIndex },
    { stem: hourStemIndex, branch: hourBranchIndex },
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
      heavenlyStem: HEAVENLY_STEMS[monthStemIndex],
      earthlyBranch: EARTHLY_BRANCHES[monthBranchIndex],
      element: STEM_ELEMENT[monthStemIndex],
    },
    day: {
      heavenlyStem: HEAVENLY_STEMS[dayStemIndex],
      earthlyBranch: EARTHLY_BRANCHES[dayBranchIndex],
      element: STEM_ELEMENT[dayStemIndex],
    },
    hour: {
      heavenlyStem: HEAVENLY_STEMS[hourStemIndex],
      earthlyBranch: EARTHLY_BRANCHES[hourBranchIndex],
      element: STEM_ELEMENT[hourStemIndex],
    },
    missingElements: missing,
    dominantElement: dominant,
  }
}