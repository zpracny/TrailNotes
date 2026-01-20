'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TagsEditor } from '@/components/TagsEditor'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getLinks,
  getAllLinks,
  createLink,
  updateLink,
  deleteLink,
  updateLinkTags,
} from '@/actions/links'
import type { LinkCategory, Link } from '@/lib/supabase/types'
import {
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Pencil,
  FolderPlus,
  Link2,
  X,
  Check,
} from 'lucide-react'

const CATEGORY_ICONS = ['📁', '🚴', '🏔️', '🔄', '🍓', '☁️', '💻', '🎮', '📚', '🎵', '🎬', '🏠']

export default function LinksPage() {
  const [categories, setCategories] = useState<LinkCategory[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // New category modal
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📁')

  // New/Edit link modal
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkDescription, setLinkDescription] = useState('')
  const [linkCategoryId, setLinkCategoryId] = useState<string | null>(null)

  // Edit category
  const [editingCategory, setEditingCategory] = useState<LinkCategory | null>(null)

  useEffect(() => {
    loadData()

    const supabase = createClient()

    // Realtime subscriptions
    const categoriesChannel = supabase
      .channel('link_categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'link_categories' }, () => {
        loadCategories()
      })
      .subscribe()

    const linksChannel = supabase
      .channel('links_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'links' }, () => {
        loadLinks()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(categoriesChannel)
      supabase.removeChannel(linksChannel)
    }
  }, [])

  useEffect(() => {
    loadLinks()
  }, [selectedCategory])

  const loadData = async () => {
    await Promise.all([loadCategories(), loadLinks()])
    setLoading(false)
  }

  const loadCategories = async () => {
    const data = await getCategories()
    setCategories(data)
  }

  const loadLinks = async () => {
    const data = selectedCategory ? await getLinks(selectedCategory) : await getAllLinks()
    setLinks(data)
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    await createCategory(newCategoryName.trim(), newCategoryIcon)
    setNewCategoryName('')
    setNewCategoryIcon('📁')
    setShowNewCategory(false)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return
    await updateCategory(editingCategory.id, newCategoryName.trim(), newCategoryIcon)
    setEditingCategory(null)
    setNewCategoryName('')
    setNewCategoryIcon('📁')
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Smazat tuto kategorii? Všechny odkazy v ní budou také smazány.')) return
    await deleteCategory(id)
    if (selectedCategory === id) {
      setSelectedCategory(null)
    }
  }

  const openLinkModal = (link?: Link) => {
    if (link) {
      setEditingLink(link)
      setLinkTitle(link.title)
      setLinkUrl(link.url)
      setLinkDescription(link.description || '')
      setLinkCategoryId(link.category_id)
    } else {
      setEditingLink(null)
      setLinkTitle('')
      setLinkUrl('')
      setLinkDescription('')
      setLinkCategoryId(selectedCategory)
    }
    setShowLinkModal(true)
  }

  const handleSaveLink = async () => {
    if (!linkTitle.trim() || !linkUrl.trim()) return

    if (editingLink) {
      await updateLink(editingLink.id, linkTitle, linkUrl, linkCategoryId, linkDescription)
    } else {
      await createLink(linkTitle, linkUrl, linkCategoryId, linkDescription)
    }

    setShowLinkModal(false)
    setEditingLink(null)
  }

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Smazat tento odkaz?')) return
    await deleteLink(id)
  }

  const filteredLinks = links.filter(link => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      link.title.toLowerCase().includes(searchLower) ||
      link.url.toLowerCase().includes(searchLower) ||
      link.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    )
  })

  const getCategoryById = (id: string | null) => categories.find(c => c.id === id)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trail-accent"></div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sidebar - Categories */}
      <div className="w-56 flex-shrink-0">
        <div className="bg-trail-card rounded-xl border border-trail-border/50 p-4 sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-trail-text">Kategorie</h2>
            <button
              onClick={() => setShowNewCategory(true)}
              className="p-1.5 rounded hover:bg-trail-accent/20 text-trail-muted hover:text-trail-accent transition-colors"
              title="Nová kategorie"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                selectedCategory === null
                  ? 'bg-trail-accent/20 text-trail-accent'
                  : 'text-trail-muted hover:bg-trail-border/50 hover:text-trail-text'
              }`}
            >
              <span>📋</span>
              <span>Všechny odkazy</span>
            </button>

            {categories.map(category => (
              <div key={category.id} className="group relative">
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-trail-accent/20 text-trail-accent'
                      : 'text-trail-muted hover:bg-trail-border/50 hover:text-trail-text'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span className="truncate">{category.name}</span>
                </button>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingCategory(category)
                      setNewCategoryName(category.name)
                      setNewCategoryIcon(category.icon)
                    }}
                    className="p-1 rounded hover:bg-trail-border/50 text-trail-muted hover:text-trail-text"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCategory(category.id)
                    }}
                    className="p-1 rounded hover:bg-red-600/20 text-trail-muted hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-trail-text">
              {selectedCategory ? getCategoryById(selectedCategory)?.name : 'Všechny odkazy'}
            </h1>
            <p className="text-trail-muted">{filteredLinks.length} odkazů</p>
          </div>
          <button
            onClick={() => openLinkModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nový odkaz
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-trail-muted" />
          <input
            type="text"
            placeholder="Hledat odkazy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-trail-card border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
          />
        </div>

        {/* Links Grid */}
        {filteredLinks.length === 0 ? (
          <div className="bg-trail-card rounded-xl p-12 text-center border border-trail-border/50">
            <Link2 className="w-12 h-12 text-trail-muted mx-auto mb-3" />
            <p className="text-trail-muted mb-4">
              {links.length === 0 ? 'Zatím žádné odkazy' : 'Žádné odkazy neodpovídají hledání'}
            </p>
            {links.length === 0 && (
              <button
                onClick={() => openLinkModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Přidat první odkaz
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLinks.map(link => {
              const category = getCategoryById(link.category_id)
              return (
                <div
                  key={link.id}
                  className="bg-trail-card rounded-xl p-4 border border-trail-border/50 hover:border-trail-accent/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-trail-text hover:text-trail-accent flex items-center gap-2 truncate"
                    >
                      {link.title}
                      <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                    </a>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openLinkModal(link)}
                        className="p-1 rounded hover:bg-trail-border/50 text-trail-muted hover:text-trail-text"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="p-1 rounded hover:bg-red-600/20 text-trail-muted hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-trail-muted font-mono truncate mb-2">{link.url}</p>

                  {link.description && (
                    <p className="text-sm text-trail-muted mb-3 line-clamp-2">{link.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    {category && (
                      <span className="text-xs text-trail-muted flex items-center gap-1">
                        <span>{category.icon}</span>
                        {category.name}
                      </span>
                    )}
                    <TagsEditor
                      tags={link.tags || []}
                      onSave={async (tags) => {
                        await updateLinkTags(link.id, tags)
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* New Category Modal */}
      {(showNewCategory || editingCategory) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-trail-card rounded-xl border border-trail-border p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-trail-text mb-4">
              {editingCategory ? 'Upravit kategorii' : 'Nová kategorie'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-trail-text mb-2">Název</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="např. Raspberry Pi"
                  className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-trail-text mb-2">Ikona</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setNewCategoryIcon(icon)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                        newCategoryIcon === icon
                          ? 'bg-trail-accent/20 border-2 border-trail-accent'
                          : 'bg-trail-bg border border-trail-border hover:border-trail-accent/50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1 px-4 py-2.5 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {editingCategory ? 'Uložit' : 'Vytvořit'}
              </button>
              <button
                onClick={() => {
                  setShowNewCategory(false)
                  setEditingCategory(null)
                  setNewCategoryName('')
                  setNewCategoryIcon('📁')
                }}
                className="px-4 py-2.5 bg-trail-bg border border-trail-border text-trail-text rounded-lg hover:bg-trail-border/50 transition-colors"
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-trail-card rounded-xl border border-trail-border p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-trail-text mb-4">
              {editingLink ? 'Upravit odkaz' : 'Nový odkaz'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-trail-text mb-2">Název *</label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="např. Raspberry Pi dokumentace"
                  className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-trail-text mb-2">URL *</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-trail-text mb-2">Kategorie</label>
                <select
                  value={linkCategoryId || ''}
                  onChange={(e) => setLinkCategoryId(e.target.value || null)}
                  className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
                >
                  <option value="">Bez kategorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-trail-text mb-2">Popis</label>
                <textarea
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveLink}
                disabled={!linkTitle.trim() || !linkUrl.trim()}
                className="flex-1 px-4 py-2.5 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {editingLink ? 'Uložit' : 'Vytvořit'}
              </button>
              <button
                onClick={() => {
                  setShowLinkModal(false)
                  setEditingLink(null)
                }}
                className="px-4 py-2.5 bg-trail-bg border border-trail-border text-trail-text rounded-lg hover:bg-trail-border/50 transition-colors"
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
