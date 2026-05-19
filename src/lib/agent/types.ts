import type { FengShuiAnalysis } from '@/lib/fengshui/types'
import type { Locale } from '@/lib/i18n/types'

export interface FamilyMember {
  id: string
  name: string
  dob: string
  hour?: string
  relationship: 'father' | 'mother' | 'brother' | 'sister' | 'grandfather' | 'grandmother' | 'other'
}

export interface NameGenerationRequest {
  surname?: string
  gender: 'male' | 'female' | 'neutral'
  birthDate?: string
  birthTime?: string
  preferences?: string[]
  locale: Locale
  familyMembers?: FamilyMember[]
  nameCount?: number
  nameLength?: number
  previousNames?: { native: string; romanization: string }[]
  appendResults?: boolean
}

export interface NameGenerationResponse {
  names: GeneratedName[]
  analysis?: FengShuiAnalysis
  nickname: string
}

export interface GeneratedName {
  native: string
  romanization: string
  hanzi?: string
  meaning: string
  culturalSignificance: string
  nickname?: string
}

export interface NameAnalysis {
  id: string
  type: 'fengshui' | 'numerology' | 'bazi' | 'horoscope' | 'yijing'
  name: string
  surname: string
  result: string
  timestamp: number
}

export type AnalysisType = 'fengshui' | 'numerology' | 'bazi' | 'horoscope' | 'yijing'
