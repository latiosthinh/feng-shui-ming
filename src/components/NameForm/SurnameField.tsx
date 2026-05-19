'use client'
import { useTranslation } from '@/lib/i18n/hooks'

interface SurnameFieldProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function SurnameField({ value, onChange, error }: SurnameFieldProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-1" data-tour="surname">
      <label className="block text-sm font-medium text-gray-700">
        {t.form.surname}
        <span className="text-gray-400 text-xs ml-1">({t.form.optional})</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
          error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-400'
        } outline-none`}
        placeholder={t.form.surnamePlaceholder}
        maxLength={10}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
