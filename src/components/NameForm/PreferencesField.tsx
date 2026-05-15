"use client"
import { useTranslation } from "@/lib/i18n/hooks"

interface PreferencesFieldProps {
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}

export function PreferencesField({ value, onChange, error }: PreferencesFieldProps) {
  const { t } = useTranslation()

  const preferences = [
    { key: "nature", label: t.form.nature, emoji: "🌿" },
    { key: "virtue", label: t.form.virtue, emoji: "✨" },
    { key: "strength", label: t.form.strength, emoji: "💪" },
    { key: "wisdom", label: t.form.wisdom, emoji: "📚" },
    { key: "beauty", label: t.form.beauty, emoji: "🌸" },
    { key: "peace", label: t.form.peace, emoji: "☮️" },
  ]

  const allKeys = preferences.map((p) => p.key)
  const allSelected = allKeys.every((k) => value.includes(k))
  const maxReached = value.length >= 5 && !allSelected

  const toggle = (key: string) => {
    if (value.includes(key)) {
      onChange(value.filter((v) => v !== key))
    } else if (value.length < 5 || allSelected) {
      onChange([...value, key])
    }
  }

  const handleSelectAll = () => {
    if (allSelected) {
      onChange([])
    } else {
      onChange(allKeys)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {t.form.preferences} ({value.length}/{preferences.length})
        </label>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors"
        >
          {allSelected ? "取消全选" : "全选"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {preferences.map((pref) => {
          const isSelected = value.includes(pref.key)
          const disabled = !isSelected && maxReached
          return (
            <button
              key={pref.key}
              type="button"
              onClick={() => toggle(pref.key)}
              disabled={disabled}
              className={`px-4 py-2 rounded-xl border-2 transition-all text-sm ${
                isSelected
                  ? "border-purple-400 bg-purple-50 text-purple-700"
                  : "border-gray-200 text-gray-600 hover:border-purple-200 disabled:opacity-40"
              }`}
            >
              <span className="mr-1">{pref.emoji}</span>
              {pref.label}
            </button>
          )
        })}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
