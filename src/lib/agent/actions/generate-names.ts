"use server"

import type { NameGenerationRequest, NameGenerationResponse, GeneratedName } from "@/lib/agent/types"
import type { FengShuiAnalysis } from "@/lib/fengshui/types"
import { SYSTEM_PROMPT, NAME_GENERATION_PROMPT } from "@/lib/agent/prompts"
import { saveNames } from "@/lib/agent/data/database"

const API_URL = process.env.MIMO_API_BASE_URL || "https://api.xiaomimimo.com/v1"
const API_KEY = process.env.MIMO_API_KEY!
const MODEL = process.env.MIMO_MODEL || "mimo-v2.5-pro"

export async function generateNamesAction(
  request: NameGenerationRequest
): Promise<NameGenerationResponse> {
  const nameCount = request.nameCount || 3
  const prompt = buildPrompt(request, nameCount)

  const res = await fetch(`${API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`MIMO API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ""

  const result = parseResponse(content)
  saveNames(result.names)
  return result
}

function buildPrompt(request: NameGenerationRequest, nameCount: number): string {
  const localeNames: Record<string, string> = { zh: "中文", ja: "日本語", ko: "한국어", vi: "Tiếng Việt" }
  const genderNames: Record<string, string> = { male: "男孩", female: "女孩", neutral: "中性" }
  const relationshipNames: Record<string, string> = {
    father: "父亲", mother: "母亲", brother: "兄弟", sister: "姐妹",
    grandfather: "祖父", grandmother: "祖母", other: "亲属",
  }

  let familyInfo = ""
  if (request.familyMembers && request.familyMembers.length > 0) {
    const members = request.familyMembers
      .map((m) => `- ${relationshipNames[m.relationship] || m.relationship}：${m.name}（出生：${m.dob}${m.hour ? ` ${m.hour}` : ""}）`)
      .join("\n")
    familyInfo = `\n家庭成员信息（仅作参考用字风格，不直接使用其名字）：\n${members}`
  }

  const surname = request.surname || "无"
  const gender = genderNames[request.gender] || "中性"
  const birthDate = request.birthDate || "未提供"
  const birthTime = request.birthTime || "未提供"
  const prefs = request.preferences?.length ? request.preferences.join("、") : "无特殊偏好"
  const locale = localeNames[request.locale] || "中文"

  return NAME_GENERATION_PROMPT
    .replace("{{nameCount}}", String(nameCount))
    .replace("{{surname}}", surname)
    .replace("{{gender}}", gender)
    .replace("{{birthDate}}", birthDate)
    .replace("{{birthTime}}", birthTime)
    .replace("{{preferences}}", prefs)
    .replace("{{familyInfo}}", familyInfo)
}

function parseResponse(content: string): NameGenerationResponse {
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    return fallbackResponse(content)
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    const names: GeneratedName[] = parsed.map((n: any) => ({
      native: n.native || "",
      romanization: n.romanization || "",
      meaning: n.meaning || "",
      culturalSignificance: n.culturalSignificance || "",
    }))

    return { names, analysis: defaultAnalysis(), nickname: parsed[0]?.nickname || "宝宝" }
  } catch {
    return fallbackResponse(content)
  }
}

function defaultAnalysis(): FengShuiAnalysis {
  return { fiveGrid: { tianGe: 0, renGe: 0, diGe: 0, waiGe: 0, zongGe: 0, overall: "neutral" }, wuXing: [], recommendations: [] }
}

function fallbackResponse(text: string): NameGenerationResponse {
  return {
    names: [{ native: text.substring(0, 20), romanization: "", meaning: text, culturalSignificance: "" }],
    analysis: defaultAnalysis(),
    nickname: "宝宝",
  }
}
