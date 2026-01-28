'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getIdea, updateIdea, deleteIdea } from '@/actions/ideas'
import { TagChip, SUGGESTED_TAGS } from '@/components/TagChip'
import type { Idea } from '@/lib/supabase/types'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'

export default function EditIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    const loadIdea = async () => {
      const data = await getIdea(id)
      setIdea(data)
      setTags(data.tags || [])
    }
    loadIdea()
  }, [id])

  const filteredSuggestions = SUGGESTED_TAGS.filter(
    tag => tag.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(tag)
  )

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput('')
    setShowSuggestions(false)
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    formData.set('tags', tags.join(','))
    await updateIdea(id, formData)
    router.push('/ideas')
  }

  const handleDelete = async () => {
    if (!confirm('Opravdu chceš smazat tento nápad?')) return
    setIsDeleting(true)
    await deleteIdea(id)
    router.push('/ideas')
  }

  if (!idea) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trail-accent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/ideas"
          className="inline-flex items-center gap-2 text-trail-muted hover:text-trail-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět na nápady
        </Link>
      </div>

      <div className="bg-trail-card rounded-xl border border-trail-border/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-trail-text">Upravit nápad</h1>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Smazat
          </button>
        </div>

        <form action={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-trail-text mb-2">
              Název *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              defaultValue={idea.title}
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-trail-text mb-2">
              Popis
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={idea.description || ''}
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-trail-text mb-2">
              Stav
            </label>
            <select
              id="status"
              name="status"
              defaultValue={idea.status ?? 'todo'}
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
            >
              <option value="todo">K řešení</option>
              <option value="in-progress">Rozpracované</option>
              <option value="done">Hotovo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-trail-text mb-2">
              Tagy
            </label>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map(tag => (
                  <TagChip key={tag} tag={tag} size="md" onRemove={() => removeTag(tag)} />
                ))}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(tagInput.trim())
                  }
                }}
                className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
                placeholder="Napiš tag a stiskni Enter..."
              />

              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-trail-card border border-trail-border rounded-lg shadow-lg z-10 max-h-48 overflow-auto">
                  {filteredSuggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => addTag(suggestion)}
                      className="w-full px-4 py-2 text-left text-trail-text hover:bg-trail-border/50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0, 6).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="px-2 py-1 text-xs bg-trail-bg border border-trail-border rounded text-trail-muted hover:text-trail-text hover:border-trail-accent transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          <input type="hidden" name="tags" value={tags.join(',')} />

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Uložit změny
            </button>
            <Link
              href="/ideas"
              className="px-4 py-2.5 bg-trail-bg border border-trail-border text-trail-text rounded-lg hover:bg-trail-border/50 transition-colors"
            >
              Zrušit
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
