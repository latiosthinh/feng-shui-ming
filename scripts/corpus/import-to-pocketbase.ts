/**
 * Import enriched names into PocketBase name_corpus collection
 * Run: npx tsx scripts/corpus/import-to-pocketbase.ts
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import PocketBase from 'pocketbase'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
const PB_EMAIL = process.env.POCKETBASE_EMAIL || 'admin@example.com'
const PB_PASSWORD = process.env.POCKETBASE_PASSWORD || 'admin'
const BATCH_SIZE = 100

interface EnrichedName {
  hanzi: string
  hanViet: string
  surnameHanzi: string
  surnameHanViet: string
  givenNameHanzi: string
  givenNameHanViet: string
  strokes: number[]
  fiveElements: string[]
  gender: string
  genderConfidence: number
  frequency: string
  meaning: string
  culturalSignificance: string
}

async function main() {
  console.log('=== Import to PocketBase ===\n')

  const enriched: EnrichedName[] = JSON.parse(
    readFileSync(join(__dirname, 'enriched-names.json'), 'utf-8')
  )
  console.log(`Total names to import: ${enriched.length}`)

  const pb = new PocketBase(PB_URL)
  try {
    await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD)
    console.log(`Connected to PocketBase at ${PB_URL}\n`)
  } catch (err) {
    console.error('Failed to connect to PocketBase:', (err as Error).message)
    console.log(`Make sure PocketBase is running at ${PB_URL}`)
    console.log('Set POCKETBASE_EMAIL and POCKETBASE_PASSWORD in .env.local')
    process.exit(1)
  }

  // Check if collection exists
  try {
    await pb.collection('name_corpus').getList(1, 1)
    console.log('Collection name_corpus exists, checking for existing data...')
    const existing = await pb.collection('name_corpus').getList(1, 1)
    console.log(`Existing records: ${existing.totalItems}\n`)
  } catch {
    console.error('Collection name_corpus does not exist!')
    console.log('Please create it first via PocketBase Admin UI.')
    console.log('See scripts/corpus/pocketbase-schema.md for schema.\n')
    process.exit(1)
  }

  // Import in batches
  let imported = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < enriched.length; i += BATCH_SIZE) {
    const batch = enriched.slice(i, i + BATCH_SIZE)
    const promises = batch.map(async (name) => {
      try {
        await pb.collection('name_corpus').create({
          hanzi: name.hanzi,
          hanViet: name.hanViet,
          surnameHanzi: name.surnameHanzi,
          surnameHanViet: name.surnameHanViet,
          givenNameHanzi: name.givenNameHanzi,
          givenNameHanViet: name.givenNameHanViet,
          strokes: name.strokes,
          fiveElements: name.fiveElements,
          gender: name.gender,
          genderConfidence: name.genderConfidence,
          frequency: name.frequency,
          meaning: name.meaning,
          culturalSignificance: name.culturalSignificance,
          isImported: true,
        })
        imported++
      } catch (err) {
        // Check if duplicate
        const msg = (err as Error).message
        if (msg.includes('duplicate') || msg.includes('unique')) {
          skipped++
        } else {
          errors++
          if (errors <= 3) {
            console.error(`  Error importing ${name.hanzi}: ${msg}`)
          }
        }
      }
    })

    await Promise.allSettled(promises)

    if ((i / BATCH_SIZE) % 10 === 0) {
      console.log(`Progress: ${Math.min(i + BATCH_SIZE, enriched.length)}/${enriched.length} (${imported} imported, ${skipped} skipped, ${errors} errors)`)
    }
  }

  console.log(`\n=== Import Complete ===`)
  console.log(`Imported: ${imported}`)
  console.log(`Skipped (duplicates): ${skipped}`)
  console.log(`Errors: ${errors}`)
  console.log(`Total in DB: ${imported}`)
}

main().catch(console.error)
