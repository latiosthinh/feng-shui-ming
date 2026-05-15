import type { FengShuiAnalysis } from "@/lib/fengshui/types"
import type { Locale } from "@/lib/i18n/types"

export interface FamilyMember {
  id: string
  name: string
  dob: string
  hour?: string
  relationship: "father" | "mother" | "brother" | "sister" | "grandfather" | "grandmother" | "other"
}

export interface NameGenerationRequest {
  surname?: string
  gender: "male" | "female" | "neutral"
  birthDate?: string
  birthTime?: string
  preferences?: string[]
  locale: Locale
  familyMembers?: FamilyMember[]
  nameCount?: number
}

export interface NameGenerationResponse {
  names: GeneratedName[]
  analysis: FengShuiAnalysis
  nickname: string
}

export interface GeneratedName {
  native: string
  romanization: string
  meaning: string
  culturalSignificance: string
}

export interface NameAnalysis {
  id: string
  type: "fengshui" | "numerology" | "bazi" | "horoscope"
  name: string
  surname: string
  result: string
  timestamp: number
}

export type AnalysisType = "fengshui" | "numerology" | "bazi" | "horoscope"
