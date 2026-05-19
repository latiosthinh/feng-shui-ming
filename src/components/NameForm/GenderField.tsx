'use client'
import { useTranslation } from '@/lib/i18n/hooks'

interface GenderFieldProps {
  value: string
  onChange: (value: 'male' | 'female' | 'neutral') => void
  error?: string
}

export function GenderField({ value, onChange, error }: GenderFieldProps) {
  const { t } = useTranslation()

  const options: { value: 'male' | 'female' | 'neutral'; label: string; emoji: string }[] = [
    { value: 'male', label: t.form.male, emoji: '♂' },
    { value: 'female', label: t.form.female, emoji: '♀' },
    { value: 'neutral', label: t.form.neutral, emoji: '⚥' },
  ]

  return (
    <div className="space-y-1" data-tour="gender">
      <label className="block text-sm font-medium text-gray-700">{t.form.gender}</label>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium ${
              value === opt.value
                ? 'border-purple-400 bg-purple-50 text-purple-700'
                : 'border-gray-200 text-gray-600 hover:border-purple-200'
            }`}
          >
            <span className="mr-1">{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
