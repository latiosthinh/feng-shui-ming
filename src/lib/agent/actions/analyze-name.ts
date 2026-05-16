"use server"

import { getAnalysisPrompt } from "@/lib/agent/prompts"
import type { AnalysisType } from "@/lib/agent/types"
import type { Locale } from "@/lib/i18n/types"

const API_URL = process.env.MIMO_API_BASE_URL || "https://api.xiaomimimo.com/v1"
const API_KEY = process.env.MIMO_API_KEY!
const MODEL = process.env.MIMO_MODEL || "mimo-v2.5-pro"

export async function analyzeNameAction(
  name: string,
  surname: string,
  type: AnalysisType,
  birthDate?: string,
  birthTime?: string,
  locale?: Locale
): Promise<string> {
  const labels = (locale === "vi")
    ? { notProvided: "Không cung cấp", dateLabel: "Ngày", timeLabel: "Giờ", emptyResult: "Kết quả phân tích trống" }
    : { notProvided: "未提供", dateLabel: "日期", timeLabel: "时间", emptyResult: "分析结果为空" }

  const birthInfo = [birthDate ? `${labels.dateLabel}：${birthDate}` : null, birthTime ? `${labels.timeLabel}：${birthTime}` : null]
    .filter(Boolean).join("，") || labels.notProvided

  const template = getAnalysisPrompt(type, locale)
  const prompt = template
    .replace("{{name}}", name)
    .replace("{{surname}}", surname)
    .replace("{{birthDate}}", birthDate || labels.notProvided)
    .replace("{{birthInfo}}", birthInfo)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90000)

  try {
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
        max_tokens: 1024,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`MIMO API error ${res.status}: ${err}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || labels.emptyResult
  } catch (err) {
    if ((err as any)?.name === "AbortError") {
      const msg = locale === "vi"
        ? "Phân tích đã hết thời gian. Vui lòng thử lại."
        : "分析超时，请重试"
      throw new Error(msg)
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}
