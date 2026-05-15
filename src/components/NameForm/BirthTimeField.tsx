"use client"
import { useTranslation } from "@/lib/i18n/hooks"

interface BirthTimeFieldProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function BirthTimeField({ value, onChange, error }: BirthTimeFieldProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{t.form.birthTime}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
          error
            ? "border-red-300 focus:border-red-500"
            : "border-gray-200 focus:border-purple-400"
        } outline-none`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
