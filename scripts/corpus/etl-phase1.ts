/**
 * Phase 1: ETL — Clone, Parse, Clean
 *
 * Parses the Chinese Names Corpus, extracts surnames, deduplicates,
 * splits into surname + givenName, filters bad cases.
 *
 * Output: scripts/corpus/clean-names.json
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CORPUS_DIR = join(__dirname, 'Chinese-Names-Corpus', 'Chinese_Names_Corpus')
const OUTPUT = join(__dirname, 'clean-names.json')

// --- 1. Load surnames from XLSX ---
import XLSX from 'xlsx'

function loadSurnames(): Set<string> {
  const wb = XLSX.readFile(join(CORPUS_DIR, 'Chinese_Family_Name（1k）.xlsx'))
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as [string, number][]
  // Skip header row, extract surname characters
  const surnames = new Set<string>()
  for (const [name] of data.slice(1)) {
    if (name && typeof name === 'string') {
      surnames.add(name.trim())
    }
  }
  console.log(`Loaded ${surnames.size} surnames from XLSX`)
  return surnames
}

// --- 2. Load all name corpus files ---
function loadCorpusFiles(): string[] {
  const files = readdirSync(CORPUS_DIR).filter(f => f.endsWith('.txt'))
  const allNames: string[] = []

  for (const file of files) {
    const content = readFileSync(join(CORPUS_DIR, file), 'utf-8')
    const lines = content.split('\n')

    // Skip header lines (first 4 lines are metadata)
    const names = lines.slice(4).map(l => l.trim()).filter(l => l.length > 0)
    console.log(`  ${file}: ${names.length} names`)
    for (const n of names) allNames.push(n)
  }

  console.log(`Total raw names: ${allNames.length}`)
  return allNames
}

// --- 3. Load gender data ---
function loadGenderData(): Map<string, string> {
  const content = readFileSync(
    join(CORPUS_DIR, 'Chinese_Names_Corpus_Gender（120W）.txt'),
    'utf-8'
  )
  const lines = content.split('\n').slice(4) // skip header
  const genderMap = new Map<string, string>()

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const [name, gender] = trimmed.split(',')
    if (name && gender) {
      genderMap.set(name.trim(), gender.trim())
    }
  }

  console.log(`Loaded ${genderMap.size} gender entries`)
  return genderMap
}

// --- 4. Filter and split ---
interface CleanName {
  hanzi: string
  surname: string
  givenName: string
  genderHint: 'male' | 'female' | 'neutral' | 'unknown'
}

function isChineseChar(c: string): boolean {
  const code = c.charCodeAt(0)
  return code >= 0x4E00 && code <= 0x9FFF
}

function isAllChinese(str: string): boolean {
  return str.length > 0 && str.split('').every(isChineseChar)
}

// Common compound surnames (复姓)
const COMPOUND_SURNAMES = new Set([
  '欧阳', '上官', '司马', '诸葛', '夏侯', '皇甫', '尉迟', '澹台',
  '公冶', '宗政', '濮阳', '淳于', '单于', '太叔', '申屠', '公孙',
  '慕容', '仲孙', '轩辕', '令狐', '钟离', '长孙', '宇文', '司徒',
  '鲜于', '司空', '闾丘', '子车', '亓官', '司寇', '仉督', '子桑',
  '颛孙', '端木', '巫马', '公西', '漆雕', '乐正', '壤驷', '公良',
  '拓跋', '夹谷', '宰父', '谷梁', '段干', '百里', '东郭', '南门',
  '呼延', '羊舌', '梁丘', '左丘', '东门', '西门', '南宫', '第五',
  '万俟', '闻人', '东方', '赫连', '东方',
])

function splitName(name: string, surnames: Set<string>): { surname: string; givenName: string } | null {
  // Try compound surnames first
  for (const cs of COMPOUND_SURNAMES) {
    if (name.startsWith(cs) && name.length > cs.length) {
      const given = name.slice(cs.length)
      if (given.length >= 1 && given.length <= 3) {
        return { surname: cs, givenName: given }
      }
    }
  }

  // Try single-character surnames
  const firstChar = name[0]
  if (surnames.has(firstChar)) {
    const given = name.slice(1)
    if (given.length >= 1 && given.length <= 3) {
      return { surname: firstChar, givenName: given }
    }
  }

  // Try two-character surname if first two chars match a surname
  if (name.length >= 3) {
    const twoChar = name.slice(0, 2)
    if (surnames.has(twoChar)) {
      const given = name.slice(2)
      if (given.length >= 1 && given.length <= 3) {
        return { surname: twoChar, givenName: given }
      }
    }
  }

  return null
}

function cleanAndFilter(rawNames: string[], surnames: Set<string>, genderMap: Map<string, string>): CleanName[] {
  const seen = new Set<string>()
  const results: CleanName[] = []
  let skipped = { total: 0, notChinese: 0, tooShort: 0, tooLong: 0, noSurname: 0, givenNameBad: 0 }

  for (const name of rawNames) {
    skipped.total++

    // Must be all Chinese characters
    if (!isAllChinese(name)) {
      skipped.notChinese++
      continue
    }

    // Full name length: 2-5 chars (surname 1-2 + given 1-3)
    if (name.length < 2) {
      skipped.tooShort++
      continue
    }
    if (name.length > 5) {
      skipped.tooLong++
      continue
    }

    // Deduplicate
    if (seen.has(name)) continue
    seen.add(name)

    // Split into surname + given name
    const split = splitName(name, surnames)
    if (!split) {
      skipped.noSurname++
      continue
    }

    // Given name must be 1-3 chars
    if (split.givenName.length < 1 || split.givenName.length > 3) {
      skipped.givenNameBad++
      continue
    }

    // Gender hint from corpus
    const genderHint = genderMap.get(name) || 'unknown'

    results.push({
      hanzi: name,
      surname: split.surname,
      givenName: split.givenName,
      genderHint: genderHint as CleanName['genderHint'],
    })
  }

  console.log('\nFiltering stats:')
  console.log(`  Total processed: ${skipped.total}`)
  console.log(`  Deduplicated: ${rawNames.length - seen.size}`)
  console.log(`  Skipped (not Chinese): ${skipped.notChinese}`)
  console.log(`  Skipped (too short): ${skipped.tooShort}`)
  console.log(`  Skipped (too long): ${skipped.tooLong}`)
  console.log(`  Skipped (no recognizable surname): ${skipped.noSurname}`)
  console.log(`  Skipped (bad given name length): ${skipped.givenNameBad}`)
  console.log(`  Clean names: ${results.length}`)

  return results
}

// --- Main ---
function main() {
  console.log('=== Phase 1: ETL — Clone, Parse, Clean ===\n')

  console.log('1. Loading surnames...')
  const surnames = loadSurnames()

  console.log('\n2. Loading gender data...')
  const genderMap = loadGenderData()

  console.log('\n3. Loading corpus files...')
  const rawNames = loadCorpusFiles()

  console.log('\n4. Cleaning and filtering...')
  const cleanNames = cleanAndFilter(rawNames, surnames, genderMap)

  console.log(`\n5. Writing ${cleanNames.length} clean names to ${OUTPUT}`)
  writeFileSync(OUTPUT, JSON.stringify(cleanNames, null, 2), 'utf-8')

  console.log('\nPhase 1 complete!')
}

main()
