'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createIdea } from '@/actions/ideas'
import { TagChip, SUGGESTED_TAGS } from '@/components/TagChip'
import { ArrowLeft, Plus } from 'lucide-react'

export default function NewIdeaPage() {
  const router = useRouter()
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

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
    await createIdea(formData)
    router.push('/ideas')
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
        <h1 className="text-2xl font-bold text-trail-text mb-6">Nový nápad</h1>

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
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
              placeholder="např. Vytvořit weather dashboard pro TrailMeteo"
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
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent resize-none"
              placeholder="Popiš svůj nápad podrobněji..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-trail-text mb-2">
              Tagy
            </label>

            {/* Current Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map(tag => (
                  <TagChip key={tag} tag={tag} size="md" onRemove={() => removeTag(tag)} />
                ))}
              </div>
            )}

            {/* Tag Input */}
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

              {/* Suggestions Dropdown */}
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

            {/* Quick Add Tags */}
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
                <Plus className="w-4 h-4" />
              )}
              Vytvořit nápad
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
