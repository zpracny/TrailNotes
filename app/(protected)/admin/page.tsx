'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getAccessMode,
  setAccessMode,
  getAllowedUsers,
  addAllowedUser,
  removeAllowedUser,
} from '@/actions/admin'
import {
  Shield,
  Users,
  Globe,
  UserCheck,
  Plus,
  Trash2,
  ArrowLeft,
  Check,
} from 'lucide-react'

type AllowedUser = {
  id: string
  email: string
  added_by: string | null
  created_at: string
}

export default function AdminPage() {
  const [accessMode, setAccessModeState] = useState<'all' | 'whitelist'>('all')
  const [users, setUsers] = useState<AllowedUser[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [mode, allowedUsers] = await Promise.all([
        getAccessMode(),
        getAllowedUsers(),
      ])
      setAccessModeState(mode)
      setUsers(allowedUsers)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleModeChange = async (mode: 'all' | 'whitelist') => {
    setSaving(true)
    setError(null)
    try {
      await setAccessMode(mode)
      setAccessModeState(mode)
      setSuccess('Nastavení uloženo')
      setTimeout(() => setSuccess(null), 2000)
    } catch (e) {
      setError('Nepodařilo se uložit nastavení')
    } finally {
      setSaving(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return

    setError(null)
    try {
      await addAllowedUser(newEmail.trim())
      setNewEmail('')
      await loadData()
      setSuccess('Uživatel přidán')
      setTimeout(() => setSuccess(null), 2000)
    } catch (e: any) {
      setError(e.message || 'Nepodařilo se přidat uživatele')
    }
  }

  const handleRemoveUser = async (id: string) => {
    if (!confirm('Opravdu odebrat tohoto uživatele?')) return

    try {
      await removeAllowedUser(id)
      await loadData()
    } catch (e) {
      setError('Nepodařilo se odebrat uživatele')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trail-accent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg hover:bg-trail-card text-trail-muted hover:text-trail-text transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-trail-text flex items-center gap-2">
            <Shield className="w-6 h-6 text-trail-accent" />
            Administrace
          </h1>
          <p className="text-trail-muted">Správa přístupu do aplikace</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-600/20 border border-red-600/50 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-600/20 border border-emerald-600/50 rounded-xl text-emerald-400 flex items-center gap-2">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Access Mode */}
      <div className="bg-trail-card rounded-xl border border-trail-border/50 p-6">
        <h2 className="font-semibold text-trail-text mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-trail-accent" />
          Režim přístupu
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleModeChange('all')}
            disabled={saving}
            className={`p-4 rounded-xl border-2 transition-colors text-left ${
              accessMode === 'all'
                ? 'border-trail-accent bg-trail-accent/10'
                : 'border-trail-border hover:border-trail-accent/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className={`w-5 h-5 ${accessMode === 'all' ? 'text-trail-accent' : 'text-trail-muted'}`} />
              <span className="font-medium text-trail-text">Všichni uživatelé</span>
            </div>
            <p className="text-sm text-trail-muted">
              Kdokoliv s Google účtem se může přihlásit
            </p>
          </button>

          <button
            onClick={() => handleModeChange('whitelist')}
            disabled={saving}
            className={`p-4 rounded-xl border-2 transition-colors text-left ${
              accessMode === 'whitelist'
                ? 'border-trail-accent bg-trail-accent/10'
                : 'border-trail-border hover:border-trail-accent/50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className={`w-5 h-5 ${accessMode === 'whitelist' ? 'text-trail-accent' : 'text-trail-muted'}`} />
              <span className="font-medium text-trail-text">Pouze povolení</span>
            </div>
            <p className="text-sm text-trail-muted">
              Přístup mají jen uživatelé ze seznamu níže
            </p>
          </button>
        </div>
      </div>

      {/* Allowed Users */}
      <div className="bg-trail-card rounded-xl border border-trail-border/50 p-6">
        <h2 className="font-semibold text-trail-text mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-trail-accent" />
          Povolení uživatelé
          {accessMode === 'all' && (
            <span className="text-xs bg-trail-border px-2 py-1 rounded-full text-trail-muted ml-2">
              neaktivní v režimu "všichni"
            </span>
          )}
        </h2>

        {/* Add User Form */}
        <form onSubmit={handleAddUser} className="flex gap-2 mb-4">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Přidat
          </button>
        </form>

        {/* Users List */}
        {users.length === 0 ? (
          <p className="text-trail-muted text-center py-8">
            Zatím žádní povolení uživatelé
          </p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-trail-bg rounded-lg"
              >
                <div>
                  <p className="text-trail-text">{user.email}</p>
                  <p className="text-xs text-trail-muted">
                    Přidáno: {new Date(user.created_at).toLocaleDateString('cs-CZ')}
                    {user.added_by && ` • ${user.added_by}`}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveUser(user.id)}
                  className="p-2 rounded hover:bg-red-600/20 text-trail-muted hover:text-red-400 transition-colors"
                  title="Odebrat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
