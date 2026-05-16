import 'server-only'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { GeneratedName } from '@/lib/agent/types'

const DB_PATH = join(process.cwd(), 'data', 'name-database.json')

function ensureDir() {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function readDb(): Array<{
  native: string
  romanization: string
  meaning: string
  culturalSignificance: string
}> {
  ensureDir()
  if (!existsSync(DB_PATH)) return []
  try {
    return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
  } catch {
    return []
  }
}

function writeDb(
  data: Array<{
    native: string
    romanization: string
    meaning: string
    culturalSignificance: string
  }>,
) {
  ensureDir()
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export function getRandomNames(count: number): GeneratedName[] {
  const db = readDb()
  if (db.length === 0) return []
  const shuffled = [...db].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, db.length))
}

export function saveNames(names: GeneratedName[]) {
  const db = readDb()
  const existing = new Set(db.map((n) => n.native))
  for (const name of names) {
    if (!existing.has(name.native)) {
      db.push({
        native: name.native,
        romanization: name.romanization,
        meaning: name.meaning,
        culturalSignificance: name.culturalSignificance,
      })
      existing.add(name.native)
    }
  }
  writeDb(db)
}

export function getDbSize(): number {
  return readDb().length
}
