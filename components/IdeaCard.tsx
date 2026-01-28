'use client'

import Link from 'next/link'
import { StatusBadge } from './StatusBadge'
import { TagsEditor } from './TagsEditor'
import { LinksEditor } from './LinksEditor'
import { updateIdeaStatus, deleteIdea, updateIdeaTags, updateIdeaLinks } from '@/actions/ideas'
import type { Idea, IdeaStatus } from '@/lib/supabase/types'
import { Pencil, Trash2, GripVertical } from 'lucide-react'
import { useState } from 'react'

interface IdeaCardProps {
  idea: Idea
  showDragHandle?: boolean
}

export function IdeaCard({ idea, showDragHandle = false }: IdeaCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleStatusChange = async (newStatus: IdeaStatus) => {
    await updateIdeaStatus(idea.id, newStatus)
  }

  const handleDelete = async () => {
    if (!confirm('Smazat tento nápad?')) return
    setIsDeleting(true)
    await deleteIdea(idea.id)
  }

  return (
    <div className="bg-trail-card rounded-xl p-4 shadow-md hover:scale-[1.02] transition-transform border border-trail-border/50 group">
      <div className="flex items-start gap-3">
        {showDragHandle && (
          <div className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity text-trail-muted">
            <GripVertical className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-semibold text-trail-text truncate">{idea.title}</h3>
            <StatusBadge status={(idea.status as IdeaStatus) ?? 'todo'} type="idea" />
          </div>

          {idea.description && (
            <p className="text-trail-muted text-sm mb-3 line-clamp-2">{idea.description}</p>
          )}

          <div className="mb-3">
            <TagsEditor
              tags={idea.tags || []}
              onSave={async (tags) => {
                await updateIdeaTags(idea.id, tags)
              }}
            />
          </div>

          <LinksEditor
            links={idea.links || []}
            onSave={async (links) => {
              await updateIdeaLinks(idea.id, links)
            }}
          />

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-trail-border/30">
            <div className="flex gap-1">
              <select
                value={idea.status ?? 'todo'}
                onChange={(e) => handleStatusChange(e.target.value as IdeaStatus)}
                className="text-xs bg-trail-bg border border-trail-border rounded px-2 py-1 text-trail-text focus:outline-none focus:ring-1 focus:ring-trail-accent"
              >
                <option value="todo">K řešení</option>
                <option value="in-progress">Rozpracované</option>
                <option value="done">Hotovo</option>
              </select>
            </div>

            <div className="flex gap-1">
              <Link
                href={`/ideas/${idea.id}`}
                className="p-1.5 rounded hover:bg-trail-border/50 text-trail-muted hover:text-trail-text transition-colors"
                title="Upravit"
              >
                <Pencil className="w-4 h-4" />
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded hover:bg-red-600/30 text-trail-muted hover:text-red-400 transition-colors disabled:opacity-50"
                title="Smazat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
