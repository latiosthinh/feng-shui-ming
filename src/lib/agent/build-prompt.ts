import type { NameGenerationRequest } from '@/lib/agent/types'
import { getNameGenerationPrompt } from '@/lib/agent/prompts'

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

export function buildPrompt(request: NameGenerationRequest, nameCount: number): string {
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
