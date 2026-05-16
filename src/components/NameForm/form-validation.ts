import { nameFormSchema, type NameFormValues } from './form-schema'
import type { Locale } from '@/lib/i18n/types'
import zh from '@/lib/i18n/locales/zh.json'
import vi from '@/lib/i18n/locales/vi.json'

const translations: Partial<Record<Locale, Record<string, string>>> = {
  zh: zh.validation,
  vi: vi.validation,
}

export interface FormErrors {
  [field: string]: string | undefined
}

export function validateForm(
  data: unknown,
  locale: Locale,
): { success: boolean; errors: FormErrors; values?: NameFormValues } {
  const result = nameFormSchema.safeParse(data)
  if (result.success) {
    return { success: true, errors: {}, values: result.data }
  }

  const errors: FormErrors = {}
  const messages = translations[locale] || translations.vi!
  for (const error of result.error.errors) {
    const field = error.path.join('.')
    const key = `${field}${error.code.charAt(0).toUpperCase() + error.code.slice(1)}`
    errors[field] = messages?.[key] || error.message
  }
  return { success: false, errors }
}
