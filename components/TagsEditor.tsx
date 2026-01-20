'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Plus } from 'lucide-react'

const SUGGESTED_TAGS = ['n8n', 'TrailMetrics', 'AWS', 'Raspberry', 'kolo', 'Alpy', 'chata']

interface TagsEditorProps {
  tags: string[]
  onSave: (tags: string[]) => Promise<void>
  disabled?: boolean
}

export function TagsEditor({ tags: initialTags, onSave, disabled }: TagsEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
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
  }, [isEditing, tags])

  const filteredSuggestions = SUGGESTED_TAGS.filter(
    tag => !tags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
  )

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setInputValue('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setTags(initialTags)
    }
  }

  const handleSave = async () => {
    if (JSON.stringify(tags) !== JSON.stringify(initialTags)) {
      setSaving(true)
      await onSave(tags)
      setSaving(false)
    }
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => !disabled && setIsEditing(true)}
        disabled={disabled}
        className="flex flex-wrap gap-1.5 min-h-[28px] cursor-pointer hover:opacity-80 transition-opacity disabled:cursor-not-allowed"
      >
        {tags.length > 0 ? (
          tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-trail-accent/20 text-trail-accent rounded-md text-xs font-medium"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-xs text-trail-muted flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Tagy
          </span>
        )}
      </button>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 bg-trail-bg border border-trail-accent rounded-lg min-h-[40px]">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-trail-accent/20 text-trail-accent rounded-md text-xs font-medium"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:bg-trail-accent/30 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Zadej tag...' : ''}
          className="flex-1 min-w-[80px] bg-transparent text-trail-text text-xs outline-none placeholder-trail-muted"
        />
        {saving && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-trail-accent" />
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-trail-card border border-trail-border rounded-lg shadow-lg z-10 overflow-hidden">
          {filteredSuggestions.map(suggestion => (
            <button
              key={suggestion}
              onClick={() => addTag(suggestion)}
              className="w-full px-3 py-2 text-left text-sm text-trail-text hover:bg-trail-accent/20 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
