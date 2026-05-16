import { NextRequest } from 'next/server'
import type { NameGenerationRequest, GeneratedName } from '@/lib/agent/types'
import { getSystemPrompt, getNameGenerationPrompt } from '@/lib/agent/prompts'
import { saveNames } from '@/lib/agent/data/database'
import { streamMimoCompletion } from '@/lib/agent/streaming/mimo-stream'
import { createIncrementalNameParser } from '@/lib/agent/streaming/incremental-parser'
import { analyzeName } from '@/lib/fengshui/engine'
import { createLRUCache } from '@/lib/fengshui/lru-cache'

const analysisCache = createLRUCache<any>(500, 3600000)

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let body: NameGenerationRequest
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const nameCount = body.nameCount || 3
  const prompt = buildPrompt(body, nameCount)
  const systemPrompt = getSystemPrompt(body.locale)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const parser = createIncrementalNameParser()
      const allNames: GeneratedName[] = []
      let index = 0

      try {
        for await (const chunk of streamMimoCompletion(systemPrompt, prompt)) {
          const parsed = parser.push(chunk)
          for (const item of parsed) {
            const name: GeneratedName = {
              native: item.name.native,
              romanization: item.name.romanization,
              meaning: item.name.meaning,
              culturalSignificance: item.name.culturalSignificance,
              nickname: item.name.nickname,
            }
            allNames.push(name)

            let analysis = null
            if (body.surname && name.native) {
              const cacheKey = `${body.surname}|${name.native}`
              const cached = analysisCache.get(cacheKey)
              if (cached) {
                analysis = cached
              } else {
                analysis = analyzeName({ surname: body.surname, givenName: name.native })
                analysisCache.set(cacheKey, analysis)
              }
            }

            const msg = JSON.stringify({
              type: 'name',
              index,
              name: {
                ...name,
                analysis,
              },
            })
            controller.enqueue(encoder.encode(msg + '\n'))
            index++
          }
        }

        if (allNames.length > 0) {
          saveNames(allNames)
        }

        controller.enqueue(
          encoder.encode(JSON.stringify({ type: 'done', count: allNames.length }) + '\n'),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', message }) + '\n'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}

function buildPrompt(request: NameGenerationRequest, nameCount: number): string {
  const localeLabels: Record<
    string,
    {
      genders: Record<string, string>
      relationships: Record<string, string>
      notProvided: string
      none: string
      familyHeader: string
      familyNote: string
      excludedHeader: string
    }
  > = {
    zh: {
      genders: { male: '男孩', female: '女孩', neutral: '中性' },
      relationships: {
        father: '父亲',
        mother: '母亲',
        brother: '兄弟',
        sister: '姐妹',
        grandfather: '祖父',
        grandmother: '祖母',
        other: '亲属',
      },
      notProvided: '未提供',
      none: '无',
      familyHeader: '家庭成员信息（仅作参考用字风格，不直接使用其名字）：',
      familyNote: '出生：',
      excludedHeader: '\n已生成的名字（请勿重复使用）：',
    },
    vi: {
      genders: { male: 'Nam', female: 'Nữ', neutral: 'Trung tính' },
      relationships: {
        father: 'Cha',
        mother: 'Mẹ',
        brother: 'Anh/Em trai',
        sister: 'Chị/Em gái',
        grandfather: 'Ông nội/ngoại',
        grandmother: 'Bà nội/ngoại',
        other: 'Người thân',
      },
      notProvided: 'Không cung cấp',
      none: 'Không',
      familyHeader:
        'Thông tin thành viên gia đình (chỉ tham khảo phong cách dùng chữ, không trực tiếp dùng tên):',
      familyNote: 'Sinh:',
      excludedHeader: '\nCác tên đã tạo trước đây (KHÔNG được tạo lại):',
    },
  }

  const labels = localeLabels[request.locale] || localeLabels.zh
  const gender = labels.genders[request.gender] || labels.genders.neutral

  let familyInfo = ''
  if (request.familyMembers && request.familyMembers.length > 0) {
    const members = request.familyMembers
      .map(
        (m) =>
          `- ${labels.relationships[m.relationship] || m.relationship}：${m.name}（${labels.familyNote}${m.dob}${m.hour ? ` ${m.hour}` : ''}）`,
      )
      .join('\n')
    familyInfo = `\n${labels.familyHeader}\n${members}`
  }

  let excludedNames = ''
  if (request.previousNames && request.previousNames.length > 0) {
    excludedNames = `${labels.excludedHeader}\n${request.previousNames.map((n) => `- ${n.romanization} (${n.native})`).join('\n')}`
  }

  const surname = request.surname || labels.none
  const birthDate = request.birthDate || labels.notProvided
  const birthTime = request.birthTime || labels.notProvided
  const prefs = request.preferences?.length ? request.preferences.join('、') : labels.none
  const nameLength = request.nameLength || 2

  const promptTemplate = getNameGenerationPrompt(request.locale)
  return promptTemplate
    .replace('{{nameCount}}', String(nameCount))
    .replace('{{nameLength}}', String(nameLength))
    .replace('{{surname}}', surname)
    .replace('{{gender}}', gender)
    .replace('{{birthDate}}', birthDate)
    .replace('{{birthTime}}', birthTime)
    .replace('{{preferences}}', prefs)
    .replace('{{familyInfo}}', familyInfo)
    .replace('{{excludedNames}}', excludedNames)
}
