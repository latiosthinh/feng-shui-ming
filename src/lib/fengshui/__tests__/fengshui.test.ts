import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { calculateFiveGrid } from '../five-grid'
import { getStrokeCount } from '../stroke-data'
import { getWuXingElement, analyzeWuXingBalance } from '../wuxing'
import { calculateBazi } from '../bazi'
import { scoreAuspiciousness } from '../auspiciousness'
import { analyzeName } from '../engine'

const KNOWN_CHARS = [
  '王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
  '明', '伟', '杰', '俊', '英', '华', '国', '文', '安', '平',
  '德', '仁', '义', '礼', '智', '信', '忠', '孝', '勇', '慧',
  '天', '地', '日', '月', '星', '辰', '云', '雨', '风', '雪',
  '山', '水', '火', '木', '土', '玉', '珠', '宝', '花', '草',
  '子', '女', '男', '人', '大', '小', '中', '上', '下', '左',
  '愛', '蓮', '陽', '光', '輝', '健', '太', '民', '宇', '浩',
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
]

// ========================
// Property-based tests
// ========================

describe('P1 — stroke idempotence', () => {
  it('getStrokeCount is idempotent for known chars', () => {
    fc.assert(
      fc.property(fc.constantFrom(...KNOWN_CHARS), (char) => {
        const s1 = getStrokeCount(char)
        const s2 = getStrokeCount(char)
        expect(s1).toBe(s2)
      }),
      { numRuns: 100 },
    )
  })
})

describe('P2 — five-grid completeness', () => {
  it('calculateFiveGrid returns all 5 grid values for non-empty inputs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KNOWN_CHARS),
        fc.constantFrom(...KNOWN_CHARS),
        (surname, given) => {
          const result = calculateFiveGrid(surname, given)
          expect(result.tianGe).toBeDefined()
          expect(result.renGe).toBeDefined()
          expect(result.diGe).toBeDefined()
          expect(result.waiGe).toBeDefined()
          expect(result.zongGe).toBeDefined()
          expect(['auspicious', 'neutral', 'inauspicious']).toContain(result.overall)
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('P4 — five-grid idempotence', () => {
  it('same surname + given produces same result', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KNOWN_CHARS),
        fc.constantFrom(...KNOWN_CHARS),
        (surname, given) => {
          const r1 = calculateFiveGrid(surname, given)
          const r2 = calculateFiveGrid(surname, given)
          expect(r1).toEqual(r2)
        },
      ),
      { numRuns: 50 },
    )
  })
})

describe('P7 — element-count invariant', () => {
  it('element counts are non-negative and sum matches', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('wood', 'fire', 'earth', 'metal', 'water' as const), {
          minLength: 0,
          maxLength: 20,
        }),
        (elements) => {
          const result = analyzeWuXingBalance(elements)
          const total = Object.values(result.counts).reduce((a, b) => a + b, 0)
          expect(total).toBe(elements.length)
          for (const val of Object.values(result.counts)) {
            expect(val).toBeGreaterThanOrEqual(0)
          }
        },
      ),
    )
  })
})

describe('P10 — score range', () => {
  it('auspiciousness score is always 0-1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 81 }),
        fc.integer({ min: 1, max: 81 }),
        fc.integer({ min: 1, max: 81 }),
        fc.integer({ min: 1, max: 81 }),
        fc.integer({ min: 1, max: 81 }),
        (tg, rg, dg, wg, zg) => {
          const fiveGrid = {
            tianGe: tg,
            renGe: rg,
            diGe: dg,
            waiGe: wg,
            zongGe: zg,
            overall: 'neutral' as const,
          }
          const result = scoreAuspiciousness(fiveGrid)
          expect(result.score).toBeGreaterThanOrEqual(0)
          expect(result.score).toBeLessThanOrEqual(1)
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('P11 — rating consistency', () => {
  it('higher score maps to equal or better rating', () => {
    const fiveGrid1 = {
      tianGe: 31,
      renGe: 24,
      diGe: 17,
      waiGe: 15,
      zongGe: 41,
      overall: 'auspicious' as const,
    }
    const fiveGrid2 = {
      tianGe: 1,
      renGe: 2,
      diGe: 3,
      waiGe: 4,
      zongGe: 5,
      overall: 'inauspicious' as const,
    }
    const r1 = scoreAuspiciousness(fiveGrid1)
    const r2 = scoreAuspiciousness(fiveGrid2)
    const ratingOrder = { poor: 0, fair: 1, good: 2, excellent: 3 }
    expect(ratingOrder[r1.rating]).toBeGreaterThanOrEqual(ratingOrder[r2.rating])
  })
})

// ========================
// Example-based tests
// ========================

describe('Five Grid — example-based', () => {
  it('李 (7 strokes) + 明 (8 strokes) gives known values', () => {
    const result = calculateFiveGrid('李', '明')
    expect(result.tianGe).toBe(8)
    expect(result.renGe).toBe(15)
    expect(result.diGe).toBe(8)
    expect(result.zongGe).toBe(15)
    expect(result.waiGe).toBe(1)
  })

  it('王 (4 strokes) + 伟 (6 strokes) gives known values', () => {
    const result = calculateFiveGrid('王', '伟')
    expect(result.tianGe).toBe(5)
    expect(result.renGe).toBe(10)
    expect(result.diGe).toBe(6)
    expect(result.waiGe).toBe(1)
    expect(result.zongGe).toBe(10)
  })

  it('张 (7 strokes) + 三 (3 strokes) gives known values', () => {
    const result = calculateFiveGrid('张', '三')
    expect(result.tianGe).toBe(8)
    expect(result.renGe).toBe(10)
    expect(result.diGe).toBe(3)
    expect(result.waiGe).toBe(1)
    expect(result.zongGe).toBe(10)
  })
})

describe('BaZi — example-based', () => {
  it('2024-01-01 12:00 gives authentic pillars (立春-based year)', () => {
    const result = calculateBazi(new Date(2024, 0, 1), '12:00')
    // Jan 1 is before 立春, so year pillar is 癸卯 (2023 lunar), not 甲辰
    expect(result.year.heavenlyStem).toBe('癸')
    expect(result.year.earthlyBranch).toBe('卯')
    expect(result.year.element).toBe('water')
    expect(result.month.heavenlyStem).toBe('甲')
    expect(result.month.earthlyBranch).toBe('子')
    expect(result.month.element).toBe('wood')
  })

  it('1990-06-15 08:00 gives valid structure', () => {
    const result = calculateBazi(new Date(1990, 5, 15), '08:00')
    expect(result.year.heavenlyStem).toBe('庚')
    expect(result.year.earthlyBranch).toBe('午')
    expect(result.month.heavenlyStem).toBe('壬')
    expect(result.month.earthlyBranch).toBe('午')
    expect(result.day.heavenlyStem).toBe('辛')
    expect(result.day.earthlyBranch).toBe('亥')
    expect(result.hour.heavenlyStem).toBe('壬')
    expect(result.hour.earthlyBranch).toBe('辰')
    expect(result.missingElements).toBeInstanceOf(Array)
    expect(result.dominantElement).toBeDefined()
  })
})

describe('Wu Xing — example-based', () => {
  it('all five elements present gives empty missing', () => {
    const result = analyzeWuXingBalance(['wood', 'fire', 'earth', 'metal', 'water'])
    expect(result.missing).toEqual([])
    expect(result.counts.wood).toBe(1)
  })

  it('only wood elements gives missing 4', () => {
    const result = analyzeWuXingBalance(['wood', 'wood', 'wood'])
    expect(result.missing).toHaveLength(4)
    expect(result.missing).toContain('fire')
    expect(result.missing).toContain('earth')
    expect(result.missing).toContain('metal')
    expect(result.missing).toContain('water')
  })
})

describe('Auspiciousness — example-based', () => {
  it('good five-grid gives at least fair', () => {
    const fiveGrid = {
      tianGe: 31,
      renGe: 24,
      diGe: 17,
      waiGe: 15,
      zongGe: 41,
      overall: 'auspicious' as const,
    }
    const result = scoreAuspiciousness(fiveGrid)
    expect(['excellent', 'good', 'fair']).toContain(result.rating)
  })
})

describe('Engine — integration', () => {
  it('analyzeName returns complete analysis for known name', () => {
    const result = analyzeName({ surname: '王', givenName: '明' })
    expect(result.fiveGrid.tianGe).toBeGreaterThan(0)
    expect(result.wuXing).toHaveLength(1)
    expect(result.recommendations.length).toBeGreaterThanOrEqual(0)
  })
})
