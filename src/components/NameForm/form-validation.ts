import { nameFormSchema, type NameFormValues } from "./form-schema"
import type { Locale } from "@/lib/i18n/types"

const errorMessages: Partial<Record<Locale, Record<string, string>>> = {
  zh: {
    genderRequired: "请选择性别",
    birthDateInvalid: "日期格式必须为 YYYY-MM-DD",
    birthTimeInvalid: "时间格式必须为 HH:MM",
    preferencesMax: "最多选择6个偏好",
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
    errors[field] = messages?.[key] || error.message
  }
  return { success: false, errors }
}
