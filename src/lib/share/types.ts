import type { GeneratedName } from '@/lib/agent/types'
import type { Locale } from '@/lib/i18n/types'

export interface ShareShortlistData {
  token: string
  names: ShareNameEntry[]
  surname?: string
  locale: Locale
  createdAt: string
}

export interface ShareNameEntry {
  name: GeneratedName
  nickname: string
}
