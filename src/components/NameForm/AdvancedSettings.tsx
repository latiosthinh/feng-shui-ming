"use client"
import { useState } from "react"
import type { FamilyMember } from "@/lib/agent/types"

interface AdvancedSettingsProps {
  familyMembers: FamilyMember[]
  onFamilyMembersChange: (members: FamilyMember[]) => void
  nameCount: number
  onNameCountChange: (count: number) => void
}

const relationships = [
  { value: "father", label: "父亲" },
  { value: "mother", label: "母亲" },
  { value: "brother", label: "兄弟" },
  { value: "sister", label: "姐妹" },
  { value: "grandfather", label: "祖父" },
  { value: "grandmother", label: "祖母" },
  { value: "other", label: "其他" },
] as const

let nextId = 1

export function AdvancedSettings({
  familyMembers,
  onFamilyMembersChange,
  nameCount,
  onNameCountChange,
}: AdvancedSettingsProps) {
  const [open, setOpen] = useState(false)

  const addMember = () => {
    onFamilyMembersChange([
      ...familyMembers,
      { id: String(nextId++), name: "", dob: "", hour: "", relationship: "father" },
    ])
  }

  const removeMember = (id: string) => {
    onFamilyMembersChange(familyMembers.filter((m) => m.id !== id))
  }

  const updateMember = (id: string, field: keyof FamilyMember, value: string) => {
    onFamilyMembersChange(
      familyMembers.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    )
  }

  const hasMembers = familyMembers.length > 0

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 text-sm font-medium transition-colors ${
          open || hasMembers ? "text-purple-600" : "text-gray-500 hover:text-purple-600"
        }`}
      >
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        高级设置
        {hasMembers && (
          <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">
            {familyMembers.length}
          </span>
        )}
      </button>

      {open && (
        <div className="space-y-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              生成名字数量 (1-6)
            </label>
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
              <label className="text-sm font-medium text-gray-700">家庭成员信息</label>
              <button
                type="button"
                onClick={addMember}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                + 添加成员
              </button>
            </div>

            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="p-3 bg-white rounded-lg border border-gray-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    成员 #{familyMembers.indexOf(member) + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="text-red-400 hover:text-red-600 text-xs transition-colors"
                  >
                    移除
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateMember(member.id, "name", e.target.value)}
                      placeholder="姓名"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <select
                      value={member.relationship}
                      onChange={(e) => updateMember(member.id, "relationship", e.target.value)}
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
                      onChange={(e) => updateMember(member.id, "dob", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={member.hour || ""}
                      onChange={(e) => updateMember(member.id, "hour", e.target.value)}
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
