'use client'

import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { IdeaCard } from '@/components/IdeaCard'
import { TagChip, SUGGESTED_TAGS } from '@/components/TagChip'
import { exportIdeasCSV } from '@/actions/ideas'
import type { Idea, IdeaStatus } from '@/lib/supabase/types'
import {
  Plus,
  Search,
  Download,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react'

type ViewMode = 'grid' | 'kanban'

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  useEffect(() => {
    const supabase = createClient()

    const fetchIdeas = async () => {
      const { data } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setIdeas(data)
      setLoading(false)
    }

    fetchIdeas()

    // Realtime subscription
    const channel = supabase
      .channel('ideas_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ideas' },
        () => {
          fetchIdeas()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      const matchesSearch =
        search === '' ||
        idea.title.toLowerCase().includes(search.toLowerCase()) ||
        idea.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))

      const matchesStatus =
        statusFilter === 'all' || idea.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [ideas, search, statusFilter])

  const kanbanColumns: { status: IdeaStatus; label: string; color: string }[] = [
    { status: 'todo', label: 'K řešení', color: 'border-slate-500' },
    { status: 'in-progress', label: 'Rozpracované', color: 'border-amber-500' },
    { status: 'done', label: 'Hotovo', color: 'border-emerald-500' },
  ]

  const handleExportCSV = async () => {
    const csv = await exportIdeasCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trailnotes-napady-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

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
          <h1 className="text-2xl font-bold text-trail-text">Nápady</h1>
          <p className="text-trail-muted">{filteredIdeas.length} nápadů</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3 py-2 bg-trail-card hover:bg-trail-border/50 text-trail-text border border-trail-border rounded-lg transition-colors"
            title="Exportovat CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <Link
            href="/ideas/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nový nápad
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-trail-muted" />
          <input
            type="text"
            placeholder="Hledat nápady nebo tagy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-trail-card border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IdeaStatus | 'all')}
            className="px-4 py-2.5 bg-trail-card border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
          >
            <option value="all">Všechny stavy</option>
            <option value="todo">K řešení</option>
            <option value="in-progress">Rozpracované</option>
            <option value="done">Hotovo</option>
          </select>

          <div className="flex bg-trail-card border border-trail-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 ${viewMode === 'grid' ? 'bg-trail-accent text-white' : 'text-trail-muted hover:text-trail-text'}`}
              title="Mřížka"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2.5 ${viewMode === 'kanban' ? 'bg-trail-accent text-white' : 'text-trail-muted hover:text-trail-text'}`}
              title="Kanban"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Tag Filters */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_TAGS.slice(0, 8).map(tag => (
          <button
            key={tag}
            onClick={() => setSearch(search === tag ? '' : tag)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              search === tag
                ? 'bg-trail-accent text-white'
                : 'bg-trail-card text-trail-muted hover:text-trail-text border border-trail-border'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Ideas Display */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-trail-card rounded-xl p-12 text-center border border-trail-border/50">
          <Filter className="w-12 h-12 text-trail-muted mx-auto mb-3" />
          <p className="text-trail-muted mb-4">Žádné nápady neodpovídají filtrům</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('all') }}
            className="text-trail-accent hover:underline"
          >
            Zrušit filtry
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map(idea => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {kanbanColumns.map(column => (
            <div key={column.status} className="space-y-3">
              <div className={`flex items-center gap-2 pb-2 border-b-2 ${column.color}`}>
                <h3 className="font-semibold text-trail-text">{column.label}</h3>
                <span className="px-2 py-0.5 bg-trail-card rounded-full text-xs text-trail-muted">
                  {filteredIdeas.filter(i => i.status === column.status).length}
                </span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {filteredIdeas
                  .filter(idea => idea.status === column.status)
                  .map(idea => (
                    <IdeaCard key={idea.id} idea={idea} showDragHandle />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
