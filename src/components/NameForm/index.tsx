'use client'
import { useState, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/hooks'
import { validateForm } from './form-validation'
import type { NameGenerationRequest, FamilyMember } from '@/lib/agent/types'
import { SurnameField } from './SurnameField'
import { GenderField } from './GenderField'
import { BirthDateField } from './BirthDateField'
import { BirthTimeField } from './BirthTimeField'
import { PreferencesField } from './PreferencesField'
import { AdvancedSettings } from './AdvancedSettings'
import { RandomButton } from './RandomButton'
import { SubmitButton } from './SubmitButton'

interface NameFormProps {
  onSubmit: (request: NameGenerationRequest) => void
  onRandom: () => void
  isLoading: boolean
}

export function NameForm({ onSubmit, onRandom, isLoading }: NameFormProps) {
  const { t, locale } = useTranslation()
  const [surname, setSurname] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('male')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [preferences, setPreferences] = useState<string[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [nameCount, setNameCount] = useState(3)
  const [nameLength, setNameLength] = useState(2)
  const [siblingSetMode, setSiblingSetMode] = useState(false)
  const [followPattern, setFollowPattern] = useState(false)
  const [includeEnglishName, setIncludeEnglishName] = useState(false)
  const [suggestNicknames, setSuggestNicknames] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const data = { surname, gender, birthDate, birthTime, preferences }
      const result = validateForm(data, locale)

      if (!result.success) {
        setErrors(result.errors)
        return
      }

      setErrors({})
      onSubmit({
        surname: surname || undefined,
        gender: result.values!.gender,
        birthDate: birthDate || undefined,
        birthTime: birthTime || undefined,
        preferences: preferences.length > 0 ? preferences : undefined,
        locale,
        familyMembers: familyMembers.length > 0 ? familyMembers : undefined,
        nameCount,
        nameLength,
        siblingSetMode: siblingSetMode || undefined,
        followPattern: followPattern || undefined,
        includeEnglishName: includeEnglishName || undefined,
        suggestNicknames: suggestNicknames || undefined,
      })
    },
    [
      surname,
      gender,
      birthDate,
      birthTime,
      preferences,
      familyMembers,
      nameCount,
      nameLength,
      siblingSetMode,
      followPattern,
      includeEnglishName,
      suggestNicknames,
      locale,
      onSubmit,
    ],
  )

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">{t.form.title}</h2>
        <RandomButton onClick={onRandom} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SurnameField value={surname} onChange={setSurname} error={errors.surname} />
        <GenderField value={gender} onChange={setGender} error={errors.gender} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BirthDateField value={birthDate} onChange={setBirthDate} error={errors.birthDate} />
        <BirthTimeField value={birthTime} onChange={setBirthTime} error={errors.birthTime} />
      </div>

      <PreferencesField value={preferences} onChange={setPreferences} error={errors.preferences} />

      <AdvancedSettings
        familyMembers={familyMembers}
        onFamilyMembersChange={setFamilyMembers}
        nameCount={nameCount}
        onNameCountChange={setNameCount}
        nameLength={nameLength}
        onNameLengthChange={setNameLength}
        siblingSetMode={siblingSetMode}
        onSiblingSetModeChange={setSiblingSetMode}
        followPattern={followPattern}
        onFollowPatternChange={setFollowPattern}
        includeEnglishName={includeEnglishName}
        onIncludeEnglishNameChange={setIncludeEnglishName}
        suggestNicknames={suggestNicknames}
        onSuggestNicknamesChange={setSuggestNicknames}
      />

      <SubmitButton isLoading={isLoading} />
    </form>
  )
}
