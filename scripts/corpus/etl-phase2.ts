/**
 * Phase 2: Hán Việt Conversion
 *
 * Maps each Chinese name → Hán Việt string with proper capitalization.
 * Uses hanviet-pinyin-words package for character→Hán Việt mapping.
 * Handles multi-reading characters (picks most common for names).
 *
 * Input: scripts/corpus/clean-names.json
 * Output: scripts/corpus/hanviet-names.json
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { hanvietData } from 'hanviet-pinyin-words'

const __dirname = dirname(fileURLToPath(import.meta.url))
const INPUT = join(__dirname, 'clean-names.json')
const OUTPUT = join(__dirname, 'hanviet-names.json')

// --- Build character → primary Hán Việt map ---
// For each character, pick the first/most common reading
const charToHanViet: Map<string, string> = new Map()

for (const [char, readings] of Object.entries(hanvietData)) {
  // readings is { pinyin: [hanviet1, hanviet2, ...], ... }
  // Pick the first pinyin's first reading as the primary
  const pinyinKeys = Object.keys(readings)
  for (const pk of pinyinKeys) {
    const hvs = (readings as Record<string, string[]>)[pk]
    if (hvs && hvs.length > 0) {
      charToHanViet.set(char, hvs[0])
      break
    }
  }
}

console.log(`Built character map with ${charToHanViet.size} entries`)

// --- Capitalization rules for Hán Việt ---
// Each word (syllable) is capitalized: "Minh Đức" not "minh đức"
function capitalizeHanViet(str: string): string {
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// --- Convert a name to Hán Việt ---
function nameToHanViet(hanzi: string): { hanViet: string; missing: string[] } {
  const parts: string[] = []
  const missing: string[] = []

  for (const char of hanzi) {
    const hv = charToHanViet.get(char)
    if (hv) {
      parts.push(hv)
    } else {
      missing.push(char)
      parts.push(char) // fallback: keep original character
    }
  }

  return {
    hanViet: capitalizeHanViet(parts.join(' ')),
    missing,
  }
}

// --- Main ---
function main() {
  console.log('=== Phase 2: Hán Việt Conversion ===\n')

  console.log('1. Loading clean names...')
  const cleanNames = JSON.parse(readFileSync(INPUT, 'utf-8'))
  console.log(`   Loaded ${cleanNames.length} names`)

  console.log('\n2. Converting to Hán Việt...')
  let converted = 0
  let partialMissing = 0
  let fullMissing = 0
  const missingChars = new Set<string>()

  const hanVietNames = cleanNames.map((n: any) => {
    const surnameResult = nameToHanViet(n.surname)
    const givenResult = nameToHanViet(n.givenName)
    const fullNameResult = nameToHanViet(n.hanzi)

    const allMissing = [...new Set([...surnameResult.missing, ...givenResult.missing])]
    if (allMissing.length > 0) {
      partialMissing++
      for (const c of allMissing) missingChars.add(c)
    }
    if (fullNameResult.missing.length === n.hanzi.length) {
      fullMissing++
    } else {
      converted++
    }

    return {
      hanzi: n.hanzi,
      hanViet: fullNameResult.hanViet,
      surnameHanzi: n.surname,
      surnameHanViet: surnameResult.hanViet,
      givenNameHanzi: n.givenName,
      givenNameHanViet: givenResult.hanViet,
      genderHint: n.genderHint,
      missingChars: allMissing,
    }
  })

  console.log(`\n   Fully converted: ${converted}`)
  console.log(`   Partial (some missing chars): ${partialMissing}`)
  console.log(`   Fully missing: ${fullMissing}`)
  console.log(`   Unique missing characters: ${missingChars.size}`)
  if (missingChars.size > 0 && missingChars.size <= 50) {
    console.log(`   Missing chars: ${[...missingChars].join(', ')}`)
  }

  console.log(`\n3. Writing ${hanVietNames.length} names to ${OUTPUT}`)
  writeFileSync(OUTPUT, JSON.stringify(hanVietNames, null, 2), 'utf-8')

  // Sample output
  const sample = hanVietNames.slice(0, 10)
  console.log('\nSample entries:')
  for (const s of sample) {
    console.log(`  ${s.hanzi} → ${s.hanViet} (surname: ${s.surnameHanzi} → ${s.surnameHanViet})`)
  }

  console.log('\nPhase 2 complete!')
}

main()
