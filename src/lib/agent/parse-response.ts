import type { NameGenerationResponse, GeneratedName } from '@/lib/agent/types'
import { calculateFiveGrid } from '@/lib/fengshui/five-grid'

function defaultFiveGrid() {
  return { tianGe: 0, renGe: 0, diGe: 0, waiGe: 0, zongGe: 0, overall: 'neutral' as const }
}

function fallbackResponse(text: string, locale?: string): NameGenerationResponse {
  const defaultNickname = locale === 'vi' ? 'Bé yêu' : '宝宝'
  if (!text) {
    const msg =
      locale === 'vi' ? 'API chưa trả về kết quả. Vui lòng thử lại.' : 'API 未返回结果，请稍后重试'
    return {
      names: [{ native: msg, romanization: '', meaning: '', culturalSignificance: '' }],
      analysis: { fiveGrid: defaultFiveGrid(), wuXing: [], recommendations: [] },
      nickname: defaultNickname,
    }
  }
  return {
    names: [
      { native: text.substring(0, 20), romanization: '', meaning: text, culturalSignificance: '' },
    ],
    analysis: { fiveGrid: defaultFiveGrid(), wuXing: [], recommendations: [] },
    nickname: defaultNickname,
  }
}

export function parseResponse(content: string, locale?: string, surname?: string): NameGenerationResponse {
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    return fallbackResponse(content, locale)
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    const names: GeneratedName[] = parsed.map((n: any) => ({
      native: n.native || '',
      romanization: n.romanization || '',
      meaning: n.meaning || '',
      culturalSignificance: n.culturalSignificance || '',
      nickname: n.nickname || undefined,
    }))

    const fiveGrid =
      names.length > 0 && surname ? calculateFiveGrid(surname, names[0].native) : defaultFiveGrid()

    const defaultNickname = locale === 'vi' ? 'Bé yêu' : '宝宝'
    return {
      names,
      analysis: { fiveGrid, wuXing: [], recommendations: [] },
      nickname: parsed[0]?.nickname || defaultNickname,
    }
  } catch {
    return fallbackResponse(content, locale)
  }
}