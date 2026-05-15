"use server"

import { getRandomNames as getDbNames } from "@/lib/agent/data/database"
import type { NameGenerationRequest, NameGenerationResponse, GeneratedName } from "@/lib/agent/types"
import type { FengShuiAnalysis } from "@/lib/fengshui/types"

const API_URL = process.env.MIMO_API_BASE_URL || "https://api.xiaomimimo.com/v1"
const API_KEY = process.env.MIMO_API_KEY!
const MODEL = process.env.MIMO_MODEL || "mimo-v2.5-pro"

export async function getRandomNamesAction(
  surname?: string,
  count: number = 5,
  gender: string = "neutral",
  locale: string = "zh"
): Promise<NameGenerationResponse> {
  const dbNames = getDbNames(3)
  const llmCount = Math.max(0, count - dbNames.length)

  let llmNames: GeneratedName[] = []
  if (llmCount > 0) {
    const s = surname || ""
    const localeNames: Record<string, string> = { zh: "中文", ja: "日本語", ko: "한국어", vi: "Tiếng Việt" }
    const localeName = localeNames[locale] || "中文"

    const prompt = surname
      ? `为姓氏"${s}"生成${llmCount}个风格多样的${localeName}名字。仅输出JSON：[{"native":"","romanization":"","meaning":"","culturalSignificance":""}]`
      : `随机生成${llmCount}个风格多样的${localeName}名字，自由选择常见姓氏。仅输出JSON：[{"native":"","romanization":"","meaning":"","culturalSignificance":""}]`

    const res = await fetch(`${API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 1.2,
        max_tokens: 2048,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      const content = data.choices?.[0]?.message?.content || ""
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          llmNames = parsed.map((n: any) => ({
            native: n.native || "",
            romanization: n.romanization || "",
            meaning: n.meaning || "",
            culturalSignificance: n.culturalSignificance || "",
          }))
        } catch {}
      }
    }
  }

  const allNames = [...dbNames, ...llmNames]
  return {
    names: allNames.slice(0, count),
    analysis: defaultAnalysis(),
    nickname: "宝宝",
  }
}

function defaultAnalysis(): FengShuiAnalysis {
  return { fiveGrid: { tianGe: 0, renGe: 0, diGe: 0, waiGe: 0, zongGe: 0, overall: "neutral" }, wuXing: [], recommendations: [] }
}
