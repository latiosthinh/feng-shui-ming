import type { NameGenerationResponse, GeneratedName } from '@/lib/agent/types'
import { calculateFiveGrid } from '@/lib/fengshui/five-grid'

function defaultFiveGrid() {
  return { tianGe: 0, renGe: 0, diGe: 0, waiGe: 0, zongGe: 0, overall: 'neutral' as const }
}

function fallbackResponse(text: string, locale?: string): NameGenerationResponse {
  const defaultNickname = locale === 'zh' ? '宝宝' : 'Bé yêu'
  const errorMsg =
    locale === 'zh' ? '未能解析结果，请稍后重试' : 'Không thể phân tích kết quả. Vui lòng thử lại.'
  return {
    names: [
      { native: '', romanization: '', meaning: text ? errorMsg : '', culturalSignificance: '' },
    ],
    analysis: { fiveGrid: defaultFiveGrid(), wuXing: [], recommendations: [] },
    nickname: defaultNickname,
  }
}

export function parseResponse(
  content: string,
  locale?: string,
  surname?: string,
): NameGenerationResponse {
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

    const defaultNickname = locale === 'zh' ? '宝宝' : 'Bé yêu'
    return {
      names,
      analysis: { fiveGrid, wuXing: [], recommendations: [] },
      nickname: parsed[0]?.nickname || defaultNickname,
    }
  } catch {
    return fallbackResponse(content, locale)
  }
}
