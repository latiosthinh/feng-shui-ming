export interface ParseResult {
  name: {
    native: string
    romanization: string
    hanzi?: string
    meaning: string
    culturalSignificance: string
    nickname?: string
  }
}

export interface IncrementalParser {
  push(chunk: string): ParseResult[]
  getBuffer(): string
  getDesyncCount(): number
}

export function createIncrementalNameParser(): IncrementalParser {
  let buffer = ''
  let processedUpTo = 0

  function scan(): ParseResult[] {
    const found: ParseResult[] = []
    let braceDepth = 0
    let inString = false
    let escape = false
    let objectStart = -1

    for (let i = processedUpTo; i < buffer.length; i++) {
      const ch = buffer[i]

      if (escape) {
        escape = false
        continue
      }

      if (ch === '\\' && inString) {
        escape = true
        continue
      }

      if (ch === '"') {
        inString = !inString
        continue
      }

      if (!inString) {
        if (ch === '{') {
          if (braceDepth === 0) {
            objectStart = i
          }
          braceDepth++
          continue
        }

        if (ch === '}') {
          braceDepth--
          if (braceDepth === 0 && objectStart >= 0) {
            const jsonStr = buffer.slice(objectStart, i + 1)
            try {
              const parsed = JSON.parse(jsonStr)
              if (parsed.native || parsed.romanization) {
                found.push({
                  name: {
                    native: parsed.native || '',
                    romanization: parsed.romanization || '',
                    hanzi: parsed.hanzi || undefined,
                    meaning: parsed.meaning || '',
                    culturalSignificance: parsed.culturalSignificance || '',
                    nickname: parsed.nickname || undefined,
                  },
                })
              }
            } catch {
              // skip malformed JSON
            }
            processedUpTo = i + 1
            objectStart = -1
          }
          continue
        }
      }
    }

    return found
  }

  return {
    push(chunk: string): ParseResult[] {
      buffer += chunk
      return scan()
    },
    getBuffer(): string {
      return buffer
    },
    getDesyncCount(): number {
      return 0
    },
  }
}
