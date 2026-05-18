'use client'
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { UserProfile, UserTier } from '@/lib/auth/types'
import { generateFingerprint } from './fingerprint'
import { createPocketBase } from '@/lib/pocketbase/client'

interface AuthContextValue {
  user: UserProfile | null
  isLoading: boolean
  fingerprint: string
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fingerprint, setFingerprint] = useState('')
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const init = async () => {
      const fp = await generateFingerprint()
      setFingerprint(fp)

      const pb = createPocketBase()
      if (pb.authStore.isValid && pb.authStore.record) {
        try {
          const record = await pb.collection('users').authRefresh()
          setUser(mapRecordToProfile(record.record))
        } catch {
          pb.authStore.clear()
        }
      }
      setIsLoading(false)
    }
    init()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const pb = createPocketBase()
    const authData = await pb.collection('users').authWithPassword(email, password)
    const profile = mapRecordToProfile(authData.record)
    setUser(profile)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const pb = createPocketBase()
    const authData = await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      emailVisibility: true,
    })
    const profile = mapRecordToProfile(authData.record)
    setUser(profile)
  }, [])

  const logout = useCallback(() => {
    const pb = createPocketBase()
    pb.authStore.clear()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const pb = createPocketBase()
    if (!pb.authStore.isValid) return
    try {
      const record = await pb.collection('users').authRefresh()
      setUser(mapRecordToProfile(record.record))
    } catch {
      pb.authStore.clear()
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, fingerprint, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function mapRecordToProfile(record: any): UserProfile {
  return {
    id: record.id,
    email: record.email || '',
    tier: (record.tier as UserTier) || 'free',
    purchaseCode: record.purchaseCode || '',
    totalGenerations: record.totalGenerations || 0,
    totalAnalyzes: record.totalAnalyzes || 0,
    totalChatNames: record.totalChatNames || 0,
    totalFavorites: record.totalFavorites || 0,
  }
}
