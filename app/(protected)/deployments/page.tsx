'use client'

import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DeploymentRow } from '@/components/DeploymentRow'
import { pingAllDeployments } from '@/actions/deployments'
import type { Deployment, DeploymentStatus, Platform } from '@/lib/supabase/types'
import {
  Plus,
  Search,
  RefreshCw,
  Server,
} from 'lucide-react'

const PLATFORMS: Platform[] = ['AWS Lambda', 'n8n', 'Raspberry Pi', 'Docker', 'Vercel', 'EC2']

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DeploymentStatus | 'all'>('all')
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all')
  const [isPingingAll, setIsPingingAll] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'last_ping' | 'created_at'>('created_at')

  useEffect(() => {
    const supabase = createClient()

    const fetchDeployments = async () => {
      const { data } = await supabase
        .from('deployments')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setDeployments(data)
      setLoading(false)
    }

    fetchDeployments()

    // Realtime subscription
    const channel = supabase
      .channel('deployments_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deployments' },
        () => {
          fetchDeployments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredDeployments = useMemo(() => {
    let filtered = deployments.filter(dep => {
      const matchesSearch =
        search === '' ||
        dep.name.toLowerCase().includes(search.toLowerCase()) ||
        dep.project.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || dep.status === statusFilter

      const matchesPlatform =
        platformFilter === 'all' || dep.platform === platformFilter

      return matchesSearch && matchesStatus && matchesPlatform
    })

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'last_ping') {
        const aTime = a.lastPing ? new Date(a.lastPing).getTime() : 0
        const bTime = b.lastPing ? new Date(b.lastPing).getTime() : 0
        return bTime - aTime
      } else {
        return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      }
    })

    return filtered
  }, [deployments, search, statusFilter, platformFilter, sortBy])

  const handlePingAll = async () => {
    setIsPingingAll(true)
    await pingAllDeployments()
    setIsPingingAll(false)
  }

  const stats = useMemo(() => ({
    total: deployments.length,
    running: deployments.filter(d => d.status === 'running').length,
    stopped: deployments.filter(d => d.status === 'stopped').length,
    error: deployments.filter(d => d.status === 'error').length,
  }), [deployments])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trail-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-trail-text">Služby</h1>
          <p className="text-trail-muted">{filteredDeployments.length} služeb</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePingAll}
            disabled={isPingingAll}
            className="inline-flex items-center gap-2 px-3 py-2 bg-trail-card hover:bg-trail-border/50 text-trail-text border border-trail-border rounded-lg transition-colors disabled:opacity-50"
            title="Pingovat všechny běžící služby"
          >
            <RefreshCw className={`w-4 h-4 ${isPingingAll ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Ping všech</span>
          </button>
          <Link
            href="/deployments/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nová služba
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-trail-card rounded-xl border border-trail-border/50">
        <div className="flex items-center gap-2">
          <span className="text-trail-muted">Celkem:</span>
          <span className="font-semibold text-trail-text">{stats.total}</span>
        </div>
        <div className="w-px bg-trail-border" />
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">🟢</span>
          <span className="text-trail-muted">Běží:</span>
          <span className="font-semibold text-emerald-400">{stats.running}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-400">🟡</span>
          <span className="text-trail-muted">Zastaveno:</span>
          <span className="font-semibold text-amber-400">{stats.stopped}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-400">🔴</span>
          <span className="text-trail-muted">Chyba:</span>
          <span className="font-semibold text-red-400">{stats.error}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-trail-muted" />
          <input
            type="text"
            placeholder="Hledat služby..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-trail-card border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DeploymentStatus | 'all')}
            className="px-4 py-2.5 bg-trail-card border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
          >
            <option value="all">Všechny stavy</option>
            <option value="running">Běží</option>
            <option value="stopped">Zastaveno</option>
            <option value="error">Chyba</option>
          </select>

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as Platform | 'all')}
            className="px-4 py-2.5 bg-trail-card border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
          >
            <option value="all">Všechny platformy</option>
            {PLATFORMS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2.5 bg-trail-card border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
          >
            <option value="created_at">Nejnovější</option>
            <option value="name">Název</option>
            <option value="last_ping">Poslední ping</option>
          </select>
        </div>
      </div>

      {/* Deployments Table */}
      {filteredDeployments.length === 0 ? (
        <div className="bg-trail-card rounded-xl p-12 text-center border border-trail-border/50">
          <Server className="w-12 h-12 text-trail-muted mx-auto mb-3" />
          <p className="text-trail-muted mb-4">
            {deployments.length === 0 ? 'Zatím žádné služby' : 'Žádné služby neodpovídají filtrům'}
          </p>
          {deployments.length === 0 ? (
            <Link
              href="/deployments/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Přidat první službu
            </Link>
          ) : (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setPlatformFilter('all') }}
              className="text-trail-accent hover:underline"
            >
              Zrušit filtry
            </button>
          )}
        </div>
      ) : (
        <div className="bg-trail-card rounded-xl border border-trail-border/50 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead className="bg-trail-border/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-trail-muted uppercase tracking-wider">
                  Název
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-trail-muted uppercase tracking-wider">
                  Projekt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-trail-muted uppercase tracking-wider">
                  Platforma
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-trail-muted uppercase tracking-wider">
                  URL/IP & Odkazy
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-trail-muted uppercase tracking-wider">
                  Tagy
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-trail-muted uppercase tracking-wider">
                  Stav
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-trail-muted uppercase tracking-wider">
                  Poslední ping
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-trail-muted uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-trail-border/30">
              {filteredDeployments.map(deployment => (
                <DeploymentRow key={deployment.id} deployment={deployment} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
