'use server'

import { getRandomNames as getDbNames } from '@/lib/agent/data/database'
import type {
  NameGenerationRequest,
  NameGenerationResponse,
  GeneratedName,
} from '@/lib/agent/types'
import { getRandomNamesPrompt } from '@/lib/agent/prompts'

const API_URL = process.env.MIMO_API_BASE_URL || 'https://api.xiaomimimo.com/v1'
const API_KEY = process.env.MIMO_API_KEY!
const MODEL = process.env.MIMO_MODEL || 'mimo-v2.5-pro'

const localeNames: Record<string, string> = {
  vi: 'Tiếng Việt',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
}

export async function getRandomNamesAction(
  surname?: string,
  count: number = 5,
  gender: string = 'neutral',
  locale: string = 'vi',
  dbOnly: boolean = false,
): Promise<NameGenerationResponse> {
  const dbNames = await getDbNames(3)

  let llmNames: GeneratedName[] = []
  if (!dbOnly) {
    const llmCount = Math.max(0, count - dbNames.length)
    if (llmCount > 0) {
      const localeName = localeNames[locale] || 'Tiếng Việt'
      const promptTemplate = getRandomNamesPrompt(locale as any)
      const surnameInfo = surname ? ` cho họ "${surname}"` : ''
      const prompt = promptTemplate
        .replace('{{count}}', String(llmCount))
        .replace('{{locale}}', localeName)
        .replace('{{surnameInfo}}', surnameInfo)

      const res = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 1.2,
          max_tokens: 1024,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content || ''
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0])
            llmNames = parsed.map((n: any) => ({
              native: n.native || '',
              romanization: n.romanization || '',
              meaning: n.meaning || '',
              culturalSignificance: n.culturalSignificance || '',
            }))
          } catch {}
        }
      }
    }
  }

  const allNames = [...dbNames, ...llmNames]
  return {
    names: allNames.slice(0, count),
    nickname: locale === 'zh' ? '宝宝' : 'Bé yêu',
  }
}
