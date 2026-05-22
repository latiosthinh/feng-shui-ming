import 'server-only'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { ShareShortlistData, ShareNameEntry } from './types'

const DATA_DIR = join(process.cwd(), 'data')
const SHARES_FILE = join(DATA_DIR, 'shortlist-shares.json')

interface ShareRecord {
  token: string
  names: ShareNameEntry[]
  surname?: string
  locale: string
  likes: Record<string, string[]>
  createdAt: string
}

function readShares(): Record<string, ShareRecord> {
  try {
    if (!existsSync(SHARES_FILE)) return {}
    const raw = readFileSync(SHARES_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function writeShares(shares: Record<string, ShareRecord>): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(SHARES_FILE, JSON.stringify(shares, null, 2), 'utf-8')
}

export function createShare(
  names: ShareNameEntry[],
  locale: string,
  surname?: string,
): ShareShortlistData {
  const shares = readShares()
  const token = randomUUID().slice(0, 12)
  const record: ShareRecord = {
    token,
    names,
    surname,
    locale,
    likes: {},
    createdAt: new Date().toISOString(),
  }
  shares[token] = record
  writeShares(shares)
  return {
    token,
    names,
    surname,
    locale: locale as any,
    createdAt: record.createdAt,
  }
}

export function getShare(token: string): (ShareShortlistData & { likes: Record<string, string[]> }) | null {
  const shares = readShares()
  const record = shares[token]
  if (!record) return null
  return {
    token: record.token,
    names: record.names,
    surname: record.surname,
    locale: record.locale as any,
    likes: record.likes,
    createdAt: record.createdAt,
  }
}

export function likeName(token: string, nameIndex: number, fingerprint: string): { nameIndex: number; count: number } | null {
  const shares = readShares()
  const record = shares[token]
  if (!record || nameIndex < 0 || nameIndex >= record.names.length) return null

  if (!record.likes[nameIndex]) record.likes[nameIndex] = []
  if (!record.likes[nameIndex].includes(fingerprint)) {
    record.likes[nameIndex].push(fingerprint)
  }
  writeShares(shares)
  return { nameIndex, count: record.likes[nameIndex].length }
}

export function getLikeCounts(token: string): Record<string, number> {
  const record = readShares()[token]
  if (!record) return {}
  const counts: Record<string, number> = {}
  for (const [idx, fps] of Object.entries(record.likes)) {
    counts[idx] = fps.length
  }
  return counts
}
