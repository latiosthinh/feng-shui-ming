/**
 * Phase 2: Hán Việt Conversion
 * Convert Chinese names to Sino-Vietnamese using dictionary lookup
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const HAN_VIET_DICT: Record<string, string> = JSON.parse(
  readFileSync(join(__dirname, 'hanviet.json'), 'utf-8')
)

interface CleanName {
  hanzi: string
  surname: string
  givenName: string
}

const cleanNames: CleanName[] = JSON.parse(
  readFileSync(join(__dirname, 'clean-names.json'), 'utf-8')
)

console.log('=== Phase 2: Hán Việt Conversion ===\n')

function toHanViet(char: string): string | null {
  return HAN_VIET_DICT[char] || null
}

function convertName(name: CleanName) {
  const surnameHV = name.surname.split('').map(toHanViet)
  if (surnameHV.some(v => v === null)) return null

  const givenHV = name.givenName.split('').map(toHanViet)
  if (givenHV.some(v => v === null)) return null

  return {
    hanzi: name.hanzi,
    surname: name.surname,
    surnameHanViet: surnameHV.join(' '),
    givenName: name.givenName,
    givenNameHanViet: givenHV.join(' '),
    fullHanViet: `${surnameHV.join(' ')} ${givenHV.join(' ')}`,
  }
}

const converted: any[] = []
let failed = 0

for (const name of cleanNames) {
  const result = convertName(name)
  if (result) {
    converted.push(result)
  } else {
    failed++
  }
}

console.log(`Total input: ${cleanNames.length}`)
console.log(`Successfully converted: ${converted.length}`)
console.log(`Failed (missing characters): ${failed}`)
console.log(`Conversion rate: ${(converted.length / cleanNames.length * 100).toFixed(1)}%\n`)

console.log('Sample conversions:')
for (const s of converted.slice(0, 15)) {
  console.log(`  ${s.hanzi} (${s.surname}+${s.givenName}) → ${s.fullHanViet}`)
}

writeFileSync(
  join(__dirname, 'hanviet-names.json'),
  JSON.stringify(converted, null, 2),
  'utf-8'
)
console.log(`\nWritten: hanviet-names.json (${converted.length} names)`)
console.log('\n=== Phase 2 Complete ===')
