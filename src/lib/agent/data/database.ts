import 'server-only'
import { readFile, writeFile, mkdir, rename, access } from 'fs/promises'
import { join } from 'path'

const DB_PATH = join(process.cwd(), 'data', 'name-database.json')
const TMP_PATH = DB_PATH + '.tmp'

type DbEntry = {
  native: string
  romanization: string
  hanzi?: string
  meaning: string
  culturalSignificance: string
}

let writeQueue: Promise<unknown> = Promise.resolve()

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  let result: Promise<T>
  writeQueue = writeQueue.then(
    () => (result = fn()),
    () => (result = fn()),
  )
  return result!
}

async function ensureDir() {
  try {
    await access(join(process.cwd(), 'data'))
  } catch {
    await mkdir(join(process.cwd(), 'data'), { recursive: true })
  }
}

async function readDb(): Promise<DbEntry[]> {
  await ensureDir()
  try {
    const raw = await readFile(DB_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function writeDb(data: DbEntry[]) {
  await ensureDir()
  await writeFile(TMP_PATH, JSON.stringify(data, null, 2), 'utf-8')
  await rename(TMP_PATH, DB_PATH)
}

let cache: DbEntry[] | null = null

export function getRandomNames(count: number): Promise<DbEntry[]> {
  return enqueue(async () => {
    if (!cache) cache = await readDb()
    if (cache.length === 0) return []
    const shuffled = [...cache].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, cache.length))
  })
}

export function saveNames(names: DbEntry[]): Promise<void> {
  return enqueue(async () => {
    if (!cache) cache = await readDb()
    const existing = new Set(cache.map((n) => n.native))
    for (const name of names) {
      if (!existing.has(name.native)) {
        cache.push({
          native: name.native,
          romanization: name.romanization,
          hanzi: name.hanzi,
          meaning: name.meaning,
          culturalSignificance: name.culturalSignificance,
        })
        existing.add(name.native)
      }
    }
    await writeDb(cache)
  })
}

export function getDbSize(): Promise<number> {
  return enqueue(async () => {
    if (!cache) cache = await readDb()
    return cache.length
  })
}
