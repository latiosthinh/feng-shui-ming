import { nameFormSchema, type NameFormValues } from "./form-schema"
import type { Locale } from "@/lib/i18n/types"

const errorMessages: Record<Locale, Record<string, string>> = {
  zh: {
    genderRequired: "请选择性别",
    birthDateInvalid: "日期格式必须为 YYYY-MM-DD",
    birthTimeInvalid: "时间格式必须为 HH:MM",
    preferencesMax: "最多选择6个偏好",
  },
  ja: {
    genderRequired: "性別を選択してください",
    birthDateInvalid: "日付は YYYY-MM-DD 形式です",
    birthTimeInvalid: "時刻は HH:MM 形式です",
    preferencesMax: "最大6つの好みを選択できます",
  },
  ko: {
    genderRequired: "성별을 선택하세요",
    birthDateInvalid: "날짜 형식은 YYYY-MM-DD입니다",
    birthTimeInvalid: "시간 형식은 HH:MM입니다",
    preferencesMax: "최대 6개의 선호를 선택할 수 있습니다",
  },
  vi: {
    genderRequired: "Vui lòng chọn giới tính",
    birthDateInvalid: "Ngày phải theo định dạng YYYY-MM-DD",
    birthTimeInvalid: "Giờ phải theo định dạng HH:MM",
    preferencesMax: "Tối đa 6 chủ đề ưa thích",
  },
}

export interface FormErrors {
  [field: string]: string | undefined
}

export function validateForm(data: unknown, locale: Locale): { success: boolean; errors: FormErrors; values?: NameFormValues } {
  const result = nameFormSchema.safeParse(data)
  if (result.success) {
    return { success: true, errors: {}, values: result.data }
  }

  const errors: FormErrors = {}
  const messages = errorMessages[locale]
  for (const error of result.error.errors) {
    const field = error.path.join(".")
    const key = `${field}${error.code.charAt(0).toUpperCase() + error.code.slice(1)}`
    errors[field] = messages[key] || error.message
  }
  return { success: false, errors }
}
