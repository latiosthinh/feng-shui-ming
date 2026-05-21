/**
 * Phase 4: AI Batch Enrichment (retry with improved prompt)
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const API_URL = process.env.MIMO_API_BASE_URL || 'https://api.xiaomimimo.com/v1'
const API_KEY = process.env.MIMO_API_KEY || ''
const MODEL = process.env.MIMO_MODEL || 'mimo-v2.5-pro'
const BATCH_SIZE = 50

interface CharMeaning {
  char: string
  hanViet: string
  meaning: string
  culturalSignificance: string
  genderHint: 'male' | 'female' | 'neutral'
}

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

async function batchEnrichChars(charBatch: string[]): Promise<CharMeaning[]> {
  const charsStr = charBatch.map((c, i) => `${i + 1}. ${c}`).join('\n')
  const prompt = `Bạn là chuyên gia Hán Việt. Với mỗi chữ Hán dưới đây, hãy cho biết:
- meaning: ý nghĩa tiếng Việt ngắn gọn (dùng trong đặt tên)
- culturalSignificance: ý nghĩa văn hóa khi dùng đặt tên (1 câu tiếng Việt)
- genderHint: "male", "female", hoặc "neutral"

Trả về JSON array, KHÔNG có markdown, KHÔNG có text thừa.

${charsStr}

Format:
[{"char":"明","meaning":"Sáng suốt, thông minh","culturalSignificance":"Thể hiện mong muốn con thông minh sáng dạ","genderHint":"neutral"}]`

  const res = await fetch(`${API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_completion_tokens: 4096,
    }),
  })

  if (!res.ok) throw new Error(`API ${res.status}`)

  const data = await res.json()
  let content = data.choices?.[0]?.message?.content || ''

  // Strip markdown code blocks
  content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

  // Try to find JSON array
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    console.error(`  Raw response: ${content.slice(0, 200)}`)
    throw new Error(`No JSON in response`)
  }

  return JSON.parse(jsonMatch[0])
}

async function main() {
  console.log('=== Phase 4: AI Batch Enrichment (Retry) ===\n')

  if (!API_KEY) {
    console.error('MIMO_API_KEY not set')
    process.exit(1)
  }

  const hanvietDict: Record<string, string> = JSON.parse(
    readFileSync(join(__dirname, 'hanviet.json'), 'utf-8')
  )

  // Load existing char meanings (from previous partial run)
  let existingMeanings: Record<string, CharMeaning> = {}
  try {
    existingMeanings = JSON.parse(
      readFileSync(join(__dirname, 'char-meanings.json'), 'utf-8')
    )
  } catch {}

  console.log(`Existing meanings: ${Object.keys(existingMeanings).length}`)

  // Load enriched names to find chars still needing enrichment
  const enriched: EnrichedName[] = JSON.parse(
    readFileSync(join(__dirname, 'enriched-names.json'), 'utf-8')
  )

  const uniqueChars = new Set<string>()
  for (const name of enriched) {
    for (const c of name.givenNameHanzi) {
      if (!existingMeanings[c] || !existingMeanings[c].meaning) {
        uniqueChars.add(c)
      }
    }
  }

  const charArray = [...uniqueChars]
  console.log(`Chars still needing enrichment: ${charArray.length}`)
  if (charArray.length === 0) {
    console.log('All characters already enriched!')
    return
  }
  console.log(`Batches needed: ${Math.ceil(charArray.length / BATCH_SIZE)}\n`)

  let apiCalls = 0
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < charArray.length; i += BATCH_SIZE) {
    const batch = charArray.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(charArray.length / BATCH_SIZE)
    console.log(`Batch ${batchNum}/${totalBatches}: ${batch.length} chars`)

    let retries = 0
    const maxRetries = 2

    while (retries <= maxRetries) {
      try {
        const results = await batchEnrichChars(batch)
        apiCalls++
        successCount++

        for (const r of results) {
          existingMeanings[r.char] = {
            ...r,
            hanViet: hanvietDict[r.char] || r.char,
          }
        }
        console.log(`  ✓ ${results.length} meanings`)
        break
      } catch (err) {
        retries++
        if (retries <= maxRetries) {
          console.log(`  Retry ${retries}/${maxRetries}...`)
          await new Promise(r => setTimeout(r, 3000))
        } else {
          failCount++
          console.error(`  ✗ Failed after ${maxRetries} retries: ${(err as Error).message}`)
          for (const c of batch) {
            existingMeanings[c] = {
              char: c,
              hanViet: hanvietDict[c] || c,
              meaning: '',
              culturalSignificance: '',
              genderHint: 'neutral',
            }
          }
        }
      }
    }

    if (i + BATCH_SIZE < charArray.length) {
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  console.log(`\nAPI calls: ${apiCalls}`)
  console.log(`Successful batches: ${successCount}`)
  console.log(`Failed batches: ${failCount}`)

  // Compose full name meanings
  let namesWithMeaning = 0
  for (const name of enriched) {
    if (name.meaning) {
      namesWithMeaning++
      continue
    }

    const givenChars = name.givenNameHanzi.split('')
    const meanings: string[] = []
    const culturalParts: string[] = []

    for (const char of givenChars) {
      const cm = existingMeanings[char]
      if (cm && cm.meaning) {
        meanings.push(`${cm.hanViet} (${cm.char}): ${cm.meaning}`)
        if (cm.culturalSignificance) culturalParts.push(cm.culturalSignificance)
      }
    }

    if (meanings.length > 0) {
      name.meaning = meanings.join('. ')
      name.culturalSignificance = culturalParts.join(' ')
      namesWithMeaning++
    }
  }

  console.log(`Names with meaning: ${namesWithMeaning}/${enriched.length}`)

  // Save
  writeFileSync(
    join(__dirname, 'char-meanings.json'),
    JSON.stringify(existingMeanings, null, 2),
    'utf-8'
  )
  writeFileSync(
    join(__dirname, 'enriched-names.json'),
    JSON.stringify(enriched, null, 2),
    'utf-8'
  )

  // Samples
  console.log('\nSamples:')
  for (const s of enriched.filter(n => n.meaning).slice(0, 5)) {
    console.log(`  ${s.hanzi} → ${s.surnameHanViet} ${s.givenNameHanViet}`)
    console.log(`    ${s.meaning.slice(0, 100)}...`)
  }

  console.log('\n=== Phase 4 Complete ===')
}

main().catch(console.error)
