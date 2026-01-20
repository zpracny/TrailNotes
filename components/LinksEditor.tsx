'use client'

import { useState, useRef, useEffect } from 'react'
import { Link2, X, ExternalLink, Plus } from 'lucide-react'

interface LinksEditorProps {
  links: string[]
  onSave: (links: string[]) => Promise<void>
  maxLinks?: number
  disabled?: boolean
}

export function LinksEditor({ links: initialLinks, onSave, maxLinks = 3, disabled }: LinksEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [links, setLinks] = useState<string[]>(initialLinks)
  const [inputValue, setInputValue] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleSave()
      }
    }
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditing, links])

  const addLink = () => {
    const trimmed = inputValue.trim()
    if (trimmed && links.length < maxLinks) {
      let url = trimmed
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }
      setLinks([...links, url])
      setInputValue('')
    }
  }

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addLink()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setLinks(initialLinks)
    }
  }

  const handleSave = async () => {
    if (JSON.stringify(links) !== JSON.stringify(initialLinks)) {
      setSaving(true)
      await onSave(links)
      setSaving(false)
    }
    setIsEditing(false)
  }

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-1.5">
        {links.length > 0 ? (
          links.map((link, i) => (
            <a
              key={i}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded bg-trail-border/50 hover:bg-trail-accent/20 text-trail-muted hover:text-trail-accent transition-colors"
              title={getDomain(link)}
            >
              <Link2 className="w-3.5 h-3.5" />
            </a>
          ))
        ) : null}
        {links.length < maxLinks && (
          <button
            onClick={() => !disabled && setIsEditing(true)}
            disabled={disabled}
            className="p-1.5 rounded border border-dashed border-trail-border hover:border-trail-accent/50 text-trail-muted hover:text-trail-accent transition-colors disabled:cursor-not-allowed"
            title="Pridat odkaz"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {links.map((link, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-1 px-2 py-1 bg-trail-border/50 rounded text-xs"
          >
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-trail-accent hover:underline flex items-center gap-1"
            >
              {getDomain(link)}
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => removeLink(i)}
              className="p-0.5 hover:bg-red-600/20 rounded text-trail-muted hover:text-red-400"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {links.length < maxLinks && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://..."
            className="flex-1 px-2 py-1.5 bg-trail-bg border border-trail-border rounded text-xs text-trail-text placeholder-trail-muted focus:ring-1 focus:ring-trail-accent focus:border-transparent"
          />
          <button
            onClick={addLink}
            disabled={!inputValue.trim()}
            className="px-2 py-1.5 bg-trail-accent hover:bg-trail-accent/80 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            Pridat
          </button>
        </div>
      )}

      {saving && (
        <div className="flex items-center gap-2 text-xs text-trail-muted">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-trail-accent" />
          Ukladam...
        </div>
      )}
    </div>
  )
}
