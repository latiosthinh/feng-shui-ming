import "server-only"
import { readFileSync } from "fs"
import { join } from "path"

function load(filename: string): string {
  return readFileSync(join(__dirname, filename), "utf-8").trim()
}

export const SYSTEM_PROMPT = load("system.md")
export const NAME_GENERATION_PROMPT = load("name-generation.md")
export const ANALYSIS_FENGSHUI = load("analysis-fengshui.md")
export const ANALYSIS_NUMEROLOGY = load("analysis-numerology.md")
export const ANALYSIS_BAZI = load("analysis-bazi.md")
export const ANALYSIS_HOROSCOPE = load("analysis-horoscope.md")
