import 'server-only'
import { readFileSync } from 'fs'
import { join } from 'path'

function loadStrokeDatabase(): Map<string, number> {
  const dbPath = join(process.cwd(), 'data', 'stroke-database.json')
  const raw = readFileSync(dbPath, 'utf-8')
  const entries: Record<string, number> = JSON.parse(raw)
  return new Map(Object.entries(entries))
}

let strokeData: Map<string, number> | null = null

function getStrokeData(): Map<string, number> {
  if (!strokeData) {
    strokeData = loadStrokeDatabase()
  }
  return strokeData
}

export function getStrokeCount(char: string): number {
  if (char.length !== 1) return -1
  return getStrokeData().get(char) ?? -1
}

export function countStrokes(text: string): { char: string; strokes: number }[] {
  return text.split('').map((char) => ({
    char,
    strokes: getStrokeCount(char),
  }))
}
