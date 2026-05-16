'use client'
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/hooks'
import type { FamilyMember } from '@/lib/agent/types'

interface AdvancedSettingsProps {
  familyMembers: FamilyMember[]
  onFamilyMembersChange: (members: FamilyMember[]) => void
  nameCount: number
  onNameCountChange: (count: number) => void
}

let nextId = 1

export function AdvancedSettings({
  familyMembers,
  onFamilyMembersChange,
  nameCount,
  onNameCountChange,
}: AdvancedSettingsProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const relationships = [
    { value: 'father', label: t.form.father || 'Cha' },
    { value: 'mother', label: t.form.mother || 'Mẹ' },
    { value: 'brother', label: t.form.brother || 'Anh em trai' },
    { value: 'sister', label: t.form.sister || 'Chị em gái' },
    { value: 'grandfather', label: t.form.grandfather || 'Ông' },
    { value: 'grandmother', label: t.form.grandmother || 'Bà' },
    { value: 'other', label: t.form.other || 'Khác' },
  ] as const

  const addMember = () => {
    onFamilyMembersChange([
      ...familyMembers,
      { id: String(nextId++), name: '', dob: '', hour: '', relationship: 'father' },
    ])
  }

  const removeMember = (id: string) => {
    onFamilyMembersChange(familyMembers.filter((m) => m.id !== id))
  }

  const updateMember = (id: string, field: keyof FamilyMember, value: string) => {
    onFamilyMembersChange(familyMembers.map((m) => (m.id === id ? { ...m, [field]: value } : m)))
  }

  const hasMembers = familyMembers.length > 0

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 text-sm font-medium transition-colors ${
          open || hasMembers ? 'text-purple-600' : 'text-gray-500 hover:text-purple-600'
        }`}
      >
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {t.form.advancedSettings}
        {hasMembers && (
          <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">
            {familyMembers.length}
          </span>
        )}
      </button>

      {open && (
        <div className="space-y-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t.form.nameCount}</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={6}
                value={nameCount}
                onChange={(e) => onNameCountChange(Number(e.target.value))}
                className="flex-1 accent-purple-600"
              />
              <span className="text-sm font-bold text-purple-600 w-6 text-center">{nameCount}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">{t.form.familyMembers}</label>
              <button
                type="button"
                onClick={addMember}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                {t.form.addMember}
              </button>
            </div>

            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="p-3 bg-white rounded-lg border border-gray-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    {t.form.member} #{familyMembers.indexOf(member) + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="text-red-400 hover:text-red-600 text-xs transition-colors"
                  >
                    {t.form.remove}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                      placeholder={t.form.namePlaceholder}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <select
                      value={member.relationship}
                      onChange={(e) => updateMember(member.id, 'relationship', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-purple-400 bg-white"
                    >
                      {relationships.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="date"
                      value={member.dob}
                      onChange={(e) => updateMember(member.id, 'dob', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={member.hour || ''}
                      onChange={(e) => updateMember(member.id, 'hour', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
