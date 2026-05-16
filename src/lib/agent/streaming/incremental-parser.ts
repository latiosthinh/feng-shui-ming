export interface ParseResult {
  name: {
    native: string
    romanization: string
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
  let braceDepth = 0
  let inString = false
  let escape = false
  let objectStart = -1
  let desyncCount = 0
  const results: ParseResult[] = []

  function scan(): ParseResult[] {
    const found: ParseResult[] = []
    let i = 0
    while (i < buffer.length) {
      const ch = buffer[i]

      if (escape) {
        escape = false
        i++
        continue
      }

      if (ch === '\\' && inString) {
        escape = true
        i++
        continue
      }

      if (ch === '"') {
        inString = !inString
        i++
        continue
      }

      if (!inString) {
        if (ch === '{') {
          if (braceDepth === 0) {
            objectStart = i
          }
          braceDepth++
          i++
          continue
        }

        if (ch === '}') {
          braceDepth--
          if (braceDepth === 0 && objectStart >= 0) {
            const jsonStr = buffer.slice(objectStart, i + 1)
            try {
              const parsed = JSON.parse(jsonStr)
              if (parsed.native || parsed.romanization) {
                const result: ParseResult = {
                  name: {
                    native: parsed.native || '',
                    romanization: parsed.romanization || '',
                    meaning: parsed.meaning || '',
                    culturalSignificance: parsed.culturalSignificance || '',
                    nickname: parsed.nickname || undefined,
                  },
                }
                found.push(result)
                results.push(result)
              }
            } catch {
              desyncCount++
              if (desyncCount >= 2) {
                objectStart = -1
                return found
              }
            }
            objectStart = -1
          }
          i++
          continue
        }
      }

      i++
    }

    // Trim processed content: keep only from last unmatched `{` or end
    if (braceDepth > 0 && objectStart >= 0) {
      buffer = buffer.slice(objectStart)
      objectStart = 0
    } else {
      buffer = ''
      objectStart = -1
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
      return desyncCount
    },
  }
}
