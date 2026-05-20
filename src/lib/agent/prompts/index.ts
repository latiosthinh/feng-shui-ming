import 'server-only'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Locale } from '@/lib/i18n/types'

const PROMPTS_DIR = join(process.cwd(), 'src', 'lib', 'agent', 'prompts')

function load(filename: string, locale?: Locale): string {
  if (locale) {
    const base = filename.replace('.md', '')
    const localized = `${base}.${locale}.md`
    const localizedPath = join(PROMPTS_DIR, localized)
    if (existsSync(localizedPath)) {
      const content = readFileSync(localizedPath, 'utf-8').trim()
      return content
    }
  }
  const path = join(PROMPTS_DIR, filename)
  return readFileSync(path, 'utf-8').trim()
}

export function getSystemPrompt(locale?: Locale): string {
  return load('system.md', locale)
}

export function getNameGenerationPrompt(locale?: Locale): string {
  return load('name-generation.md', locale)
}

export function getAnalysisPrompt(type: string, locale?: Locale): string {
  return load(`analysis-${type}.md`, locale)
}

export function getRandomNamesPrompt(locale?: Locale): string {
  return load('random-names.md', locale)
}

export function getChatNamesPrompt(locale?: Locale): string {
  return load('chat-names.md', locale)
}

export const SYSTEM_PROMPT = load('system.md')
export const NAME_GENERATION_PROMPT = load('name-generation.md')
export const ANALYSIS_FENGSHUI = load('analysis-fengshui.md')
export const ANALYSIS_NUMEROLOGY = load('analysis-numerology.md')
export const ANALYSIS_BAZI = load('analysis-bazi.md')
export const ANALYSIS_HOROSCOPE = load('analysis-horoscope.md')
