"use server"

import { ANALYSIS_FENGSHUI, ANALYSIS_NUMEROLOGY, ANALYSIS_BAZI, ANALYSIS_HOROSCOPE } from "@/lib/agent/prompts"
import type { AnalysisType } from "@/lib/agent/types"

const API_URL = process.env.MIMO_API_BASE_URL || "https://api.xiaomimimo.com/v1"
const API_KEY = process.env.MIMO_API_KEY!
const MODEL = process.env.MIMO_MODEL || "mimo-v2.5-pro"

const PROMPTS: Record<AnalysisType, string> = {
  fengshui: ANALYSIS_FENGSHUI,
  numerology: ANALYSIS_NUMEROLOGY,
  bazi: ANALYSIS_BAZI,
  horoscope: ANALYSIS_HOROSCOPE,
}

export async function analyzeNameAction(
  name: string,
  surname: string,
  type: AnalysisType,
  birthDate?: string,
  birthTime?: string
): Promise<string> {
  let prompt = PROMPTS[type]
    .replace("{{name}}", name)
    .replace("{{surname}}", surname)
    .replace("{{birthDate}}", birthDate || "未提供")
    .replace("{{birthInfo}}", [birthDate ? `日期：${birthDate}` : null, birthTime ? `时间：${birthTime}` : null].filter(Boolean).join("，") || "未提供出生信息")

  const res = await fetch(`${API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 2048,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`MIMO API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || "分析结果为空"
}
