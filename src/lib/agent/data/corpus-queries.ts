import 'server-only'
import PocketBase from 'pocketbase'
import { getRequiredEnvVar } from '@/lib/env'

export interface CorpusName {
  hanzi: string
  hanViet: string
  surnameHanzi: string
  surnameHanViet: string
  givenNameHanzi: string
  givenNameHanViet: string
  strokes: number[]
  fiveElements: string[]
  gender: 'male' | 'female' | 'neutral'
  genderConfidence: number
  frequency: 'common' | 'standard' | 'rare'
  meaning: string
  culturalSignificance: string
}

export interface CorpusQuery {
  surname?: string
  gender?: 'male' | 'female' | 'neutral'
  frequency?: 'common' | 'standard' | 'rare'
  limit?: number
}

let pbInstance: PocketBase | null = null

function getPb(): PocketBase {
  if (!pbInstance) {
    const url = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
    pbInstance = new PocketBase(url)
  }
  return pbInstance
}

function mapRecord(record: Record<string, any>): CorpusName {
  return {
    hanzi: record.hanzi || '',
    hanViet: record.hanViet || '',
    surnameHanzi: record.surnameHanzi || '',
    surnameHanViet: record.surnameHanViet || '',
    givenNameHanzi: record.givenNameHanzi || '',
    givenNameHanViet: record.givenNameHanViet || '',
    strokes: record.strokes || [],
    fiveElements: record.fiveElements || [],
    gender: record.gender || 'neutral',
    genderConfidence: record.genderConfidence || 0,
    frequency: record.frequency || 'standard',
    meaning: record.meaning || '',
    culturalSignificance: record.culturalSignificance || '',
  }
}

export async function queryCorpus(query: CorpusQuery): Promise<CorpusName[]> {
  const pb = getPb()
  const limit = query.limit || 10
  const filters: string[] = ['isImported = true']

  if (query.surname) {
    // Try exact match on Vietnamese surname first, then Chinese
    filters.push(
      `(surnameHanViet ~ "${query.surname}" || surnameHanzi ~ "${query.surname}")`
    )
  }

  if (query.gender && query.gender !== 'neutral') {
    filters.push(`gender = "${query.gender}"`)
  }

  if (query.frequency) {
    filters.push(`frequency = "${query.frequency}"`)
  }

  try {
    const result = await pb.collection('name_corpus').getList(1, limit, {
      filter: filters.join(' && '),
      sort: '-created',
    })
    return result.items.map(mapRecord)
  } catch (err) {
    console.error('[queryCorpus] Error:', (err as Error).message)
    return []
  }
}

export async function getRandomCorpusNames(count: number = 5): Promise<CorpusName[]> {
  const pb = getPb()

  try {
    // PocketBase doesn't have random sort, so we fetch a batch and shuffle
    const result = await pb.collection('name_corpus').getList(1, count * 3, {
      filter: 'isImported = true',
      sort: '-created',
    })

    const shuffled = [...result.items].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count).map(mapRecord)
  } catch (err) {
    console.error('[getRandomCorpusNames] Error:', (err as Error).message)
    return []
  }
}
