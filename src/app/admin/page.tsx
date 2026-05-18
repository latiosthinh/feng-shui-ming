'use client'
import { useState, useEffect, useCallback } from 'react'
import { createPocketBase } from '@/lib/pocketbase/client'
import { generatePurchaseCode } from '@/lib/auth/types'

interface AdminUser {
  id: string
  email: string
  tier: 'free' | 'paid'
  purchaseCode: string
  totalGenerations: number
  totalAnalyzes: number
  totalChatNames: number
  totalFavorites: number
  created: string
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'paid'>('all')

  useEffect(() => {
    const pb = createPocketBase()
    if (pb.authStore.isValid && pb.authStore.record?.collectionName === '_superusers') {
      setIsAuthenticated(true)
      loadUsers()
    }
  }, [])

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const pb = createPocketBase()
      await pb.admins.authWithPassword(email, password)
      setIsAuthenticated(true)
      loadUsers()
    } catch {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }, [email, password])

  const loadUsers = useCallback(async () => {
    try {
      const pb = createPocketBase()
      const result = await pb.collection('users').getFullList({ sort: '-created' })
      setUsers(
        result.map((r: any) => ({
          id: r.id,
          email: r.email || '',
          tier: r.tier || 'free',
          purchaseCode: r.purchaseCode || '',
          totalGenerations: r.totalGenerations || 0,
          totalAnalyzes: r.totalAnalyzes || 0,
          totalChatNames: r.totalChatNames || 0,
          totalFavorites: r.totalFavorites || 0,
          created: r.created || '',
        })),
      )
    } catch (e) {
      setError('Failed to load users')
    }
  }, [])

  const toggleTier = useCallback(async (userId: string, currentTier: string) => {
    try {
      const pb = createPocketBase()
      await pb.collection('users').update(userId, {
        tier: currentTier === 'paid' ? 'free' : 'paid',
      })
      loadUsers()
    } catch {
      setError('Failed to update tier')
    }
  }, [loadUsers])

  const regenerateCode = useCallback(async (userId: string) => {
    try {
      const pb = createPocketBase()
      const newCode = generatePurchaseCode()
      await pb.collection('users').update(userId, { purchaseCode: newCode })
      loadUsers()
    } catch {
      setError('Failed to regenerate code')
    }
  }, [loadUsers])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-purple-400"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) || u.purchaseCode.includes(searchTerm)
    const matchesTier = tierFilter === 'all' || u.tier === tierFilter
    return matchesSearch && matchesTier
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search email or code..."
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-64"
            />
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="all">All tiers</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generations</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Analyzes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chat Names</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Favorites</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.tier === 'paid'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{user.purchaseCode || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.totalGenerations}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.totalAnalyzes}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.totalChatNames}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.totalFavorites}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleTier(user.id, user.tier)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          user.tier === 'paid'
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                      >
                        {user.tier === 'paid' ? 'Downgrade' : 'Upgrade'}
                      </button>
                      <button
                        onClick={() => regenerateCode(user.id)}
                        className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                      >
                        New Code
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-400">No users found</div>
          )}
        </div>
      </div>
    </div>
  )
}
