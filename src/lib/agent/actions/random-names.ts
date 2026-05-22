'use server'

import { getRandomNames as getDbNames } from '@/lib/agent/data/database'
import { getRandomCorpusNames } from '@/lib/agent/data/corpus-queries'
import type {
  NameGenerationRequest,
  NameGenerationResponse,
  GeneratedName,
} from '@/lib/agent/types'
import { getRandomNamesPrompt } from '@/lib/agent/prompts'
import { getRequiredEnvVar } from '@/lib/env'

const API_URL = process.env.MIMO_API_BASE_URL || 'https://api.xiaomimimo.com/v1'
const API_KEY = getRequiredEnvVar('MIMO_API_KEY')
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
  // Run corpus query and JSON DB query in parallel
  const [corpusNames, jsonDbNames] = await Promise.all([
    getRandomCorpusNames(Math.ceil(count / 2)),
    getDbNames(Math.ceil(count / 2)),
  ])

  // Map corpus names to GeneratedName format
  const corpusGenerated: GeneratedName[] = corpusNames.map(n => ({
    native: n.hanViet,
    romanization: n.hanViet.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    hanzi: n.givenNameHanzi,
    meaning: n.meaning || '',
    culturalSignificance: n.culturalSignificance || '',
    source: 'corpus' as const,
  }))

  // Map JSON DB names
  const jsonDbGenerated: GeneratedName[] = jsonDbNames.map(n => ({
    native: n.native,
    romanization: n.romanization,
    hanzi: n.hanzi,
    meaning: n.meaning || '',
    culturalSignificance: n.culturalSignificance || '',
    source: 'corpus' as const,
  }))

  // Deduplicate by native name
  const seen = new Set<string>()
  const dbResults: GeneratedName[] = []
  for (const n of [...corpusGenerated, ...jsonDbGenerated]) {
    if (!seen.has(n.native) && n.native) {
      seen.add(n.native)
      dbResults.push(n)
    }
  }

  // If dbOnly, return DB results
  if (dbOnly) {
    return {
      names: dbResults.slice(0, count),
      nickname: locale === 'zh' ? '宝宝' : 'Bé yêu',
    }
  }

  // Fill remaining with LLM
  let llmNames: GeneratedName[] = []
  const llmCount = Math.max(0, count - dbResults.length)
  if (llmCount > 0) {
    const localeName = localeNames[locale] || 'Tiếng Việt'
    const promptTemplate = getRandomNamesPrompt(locale as any)
    const surnamePrompt = surname
      ? `为姓氏"${surname}"生成{{count}}个风格多样的${localeName}名字。`
      : `随机生成{{count}}个风格多样的${localeName}名字，自由选择常见姓氏。`
    const prompt = promptTemplate
      .replace('{{count}}', String(llmCount))
      .replace('{{surnamePrompt}}', surnamePrompt)
      .replace('{{locale}}', localeName)
      .replace('{{surnameInfo}}', surname ? ` cho họ "${surname}"` : '')

    try {
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
          max_completion_tokens: 2048,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content || ''
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          llmNames = parsed
            .filter((n: any) => n.native && n.native.trim())
            .map((n: any) => ({
              native: n.native || '',
              romanization: n.romanization || '',
              hanzi: n.hanzi || undefined,
              meaning: n.meaning || '',
              culturalSignificance: n.culturalSignificance || '',
              nickname: n.nickname || undefined,
              englishName: n.englishName || undefined,
              teasingFlags: Array.isArray(n.teasingFlags) && n.teasingFlags.length > 0 ? n.teasingFlags : undefined,
              source: 'llm' as const,
            }))
        }
      }
    } catch (err) {
      console.error('[getRandomNamesAction] LLM error:', (err as Error).message)
    }
  }

  // Merge DB results + LLM results, deduplicate
  const allNames: GeneratedName[] = [...dbResults]
  for (const n of llmNames) {
    if (!seen.has(n.native) && n.native) {
      seen.add(n.native)
      allNames.push(n)
    }
  }

  return {
    names: allNames.slice(0, count),
    nickname: locale === 'zh' ? '宝宝' : 'Bé yêu',
  }
}
