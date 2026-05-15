import type { GeneratedName } from "@/lib/agent/types"
import type { FengShuiAnalysis } from "@/lib/fengshui/types"
import type { Locale } from "@/lib/i18n/types"

export interface FavoriteEntry {
  id: string
  name: GeneratedName
  analysis: FengShuiAnalysis
  nickname: string
  savedAt: string
  locale: Locale
}
