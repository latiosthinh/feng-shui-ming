"use client"
import type { GeneratedName } from "@/lib/agent/types"

interface NameCardHeaderProps {
  name: GeneratedName
}

export function NameCardHeader({ name }: NameCardHeaderProps) {
  return (
    <div>
      <h4 className="text-3xl font-bold text-gray-800 mb-1">{name.native}</h4>
      {name.romanization && (
        <p className="text-gray-500 text-sm">{name.romanization}</p>
      )}
    </div>
  )
}
