'use client'

import { useEffect, useState, useMemo } from 'react'
import { getSubscriptionsOverview, createSubscription, updateSubscription } from '@/actions/subscriptions'
import { SubscriptionCard } from '@/components/SubscriptionCard'
import type { SubscriptionOverview, Currency, Frequency, PaymentType, Priority } from '@/lib/supabase/types'
import {
  Plus,
  CreditCard,
  RefreshCw,
  X,
  Filter,
} from 'lucide-react'

const DEFAULT_CATEGORIES = ['AI', 'Softwary', 'Licence', 'Cloud', 'Hosting', 'Nástroje', 'Ostatní']

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [customCategory, setCustomCategory] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionOverview | null>(null)
  const [filterPriorities, setFilterPriorities] = useState<number[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('')

  const fetchSubscriptions = async () => {
    const data = await getSubscriptionsOverview()
    setSubscriptions(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(s => {
      // Active filter
      if (!showInactive && !s.isActive) return false
      // Priority filter
      if (filterPriorities.length > 0 && !filterPriorities.includes(s.priority)) return false
      // Category filter
      if (filterCategory && s.category !== filterCategory) return false
      return true
    })
  }, [subscriptions, showInactive, filterPriorities, filterCategory])

  // Combine default categories with existing ones from database
  const categories = useMemo(() => {
    const existingCategories = subscriptions
      .map(s => s.category)
      .filter((c): c is string => c !== null && c !== '')
    const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...existingCategories])]
    return allCategories.sort()
  }, [subscriptions])

  const stats = useMemo(() => {
    const active = subscriptions.filter(s => s.isActive)
    return {
      totalMonthly: active.reduce((sum, s) => sum + (s.monthly_cost_czk || 0), 0),
      automaticMonthly: active
        .filter(s => s.paymentType === 'automatic')
        .reduce((sum, s) => sum + (s.monthly_cost_czk || 0), 0),
      totalCount: subscriptions.length,
      activeCount: active.length,
    }
  }, [subscriptions])

  const filteredTotal = useMemo(() => {
    return filteredSubscriptions
      .filter(s => s.isActive)
      .reduce((sum, s) => sum + (s.monthly_cost_czk || 0), 0)
  }, [filteredSubscriptions])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setIsSubmitting(true)
    const formData = new FormData(form)

    // Use custom category if selected
    if (selectedCategory === '__custom__' && customCategory.trim()) {
      formData.set('category', customCategory.trim())
    }

    if (editingSubscription) {
      await updateSubscription(editingSubscription.id, formData)
    } else {
      await createSubscription(formData)
    }

    await fetchSubscriptions()
    setIsSubmitting(false)
    handleCloseForm()
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingSubscription(null)
    setSelectedCategory('')
    setCustomCategory('')
  }

  const handleEdit = (subscription: SubscriptionOverview) => {
    setEditingSubscription(subscription)
    setSelectedCategory(subscription.category || '')
    setCustomCategory('')
    setShowForm(true)
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
      {/* Dashboard Header */}
      <div className="bg-gradient-to-br from-trail-card to-trail-card/50 rounded-2xl p-6 border border-trail-border/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-trail-muted text-sm mb-1">Celkové měsíční náklady</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-trail-text">
                {stats.totalMonthly.toLocaleString('cs-CZ')}
              </span>
              <span className="text-xl text-trail-muted">Kč/měs</span>
            </div>
            <p className="text-trail-muted text-sm mt-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              Z toho automatické platby:{' '}
              <span className="font-semibold text-amber-400">
                {stats.automaticMonthly.toLocaleString('cs-CZ')} Kč
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="bg-trail-bg/50 rounded-xl px-4 py-3 min-w-[100px]">
              <div className="text-2xl font-bold text-trail-text">{stats.activeCount}</div>
              <div className="text-xs text-trail-muted">Aktivních</div>
            </div>
            <div className="bg-trail-bg/50 rounded-xl px-4 py-3 min-w-[100px]">
              <div className="text-2xl font-bold text-trail-text">
                {Math.round(stats.totalMonthly * 12).toLocaleString('cs-CZ')}
              </div>
              <div className="text-xs text-trail-muted">Kč/rok</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-trail-text">Předplatné</h1>
          <p className="text-trail-muted">{filteredSubscriptions.length} služeb</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nové předplatné
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Priority filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-trail-muted">Priorita:</span>
            <div className="flex gap-1">
              {[
                { value: 1, label: 'Kritické', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
                { value: 2, label: 'Standard', color: 'bg-trail-accent/20 text-trail-accent border-trail-accent/50' },
                { value: 3, label: 'Zbytné', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
              ].map(p => (
                <button
                  key={p.value}
                  onClick={() => {
                    setFilterPriorities(prev =>
                      prev.includes(p.value)
                        ? prev.filter(v => v !== p.value)
                        : [...prev, p.value]
                    )
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    filterPriorities.includes(p.value)
                      ? p.color
                      : 'bg-trail-card text-trail-muted border-trail-border hover:border-trail-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-trail-muted">Kategorie:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-sm bg-trail-card border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
            >
              <option value="">Všechny</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Show inactive */}
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              showInactive
                ? 'bg-trail-accent/20 text-trail-accent border-trail-accent/50'
                : 'bg-trail-card text-trail-muted border-trail-border hover:border-trail-muted'
            }`}
          >
            <Filter className="w-3 h-3 inline mr-1" />
            Neaktivní
          </button>

          {/* Clear filters */}
          {(filterPriorities.length > 0 || filterCategory || showInactive) && (
            <button
              onClick={() => {
                setFilterPriorities([])
                setFilterCategory('')
                setShowInactive(false)
              }}
              className="px-3 py-1.5 text-xs text-trail-muted hover:text-trail-text transition-colors"
            >
              Zrušit filtry
            </button>
          )}
        </div>

        {/* Filtered total */}
        <div className="text-right">
          <span className="text-sm text-trail-muted">Vyfiltrováno: </span>
          <span className="text-lg font-bold text-trail-text">
            {filteredTotal.toLocaleString('cs-CZ')} Kč
          </span>
          <span className="text-sm text-trail-muted">/měs</span>
        </div>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-trail-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-trail-border">
            <div className="flex items-center justify-between p-4 border-b border-trail-border">
              <h2 className="text-lg font-semibold text-trail-text">
                {editingSubscription ? 'Upravit předplatné' : 'Nové předplatné'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-1 rounded hover:bg-trail-border/50 text-trail-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form key={editingSubscription?.id || 'new'} onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-trail-text mb-1">
                  Název služby *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingSubscription?.name || ''}
                  placeholder="např. Netflix, JetBrains..."
                  className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
                />
              </div>

              {/* Amount + Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-trail-text mb-1">
                    Cena *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    required
                    step="0.01"
                    min="0"
                    defaultValue={editingSubscription?.amount || ''}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-trail-text mb-1">
                    Měna
                  </label>
                  <select
                    name="currency"
                    defaultValue={editingSubscription?.currency || 'CZK'}
                    className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
                  >
                    <option value="CZK">CZK (Kč)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              {/* Frequency + Payment Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-trail-text mb-1">
                    Frekvence *
                  </label>
                  <select
                    name="frequency"
                    required
                    defaultValue={editingSubscription?.frequency || 'monthly'}
                    className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
                  >
                    <option value="monthly">Měsíčně</option>
                    <option value="yearly">Ročně</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-trail-text mb-1">
                    Typ platby *
                  </label>
                  <select
                    name="payment_type"
                    required
                    defaultValue={editingSubscription?.paymentType || 'automatic'}
                    className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
                  >
                    <option value="automatic">Automaticky</option>
                    <option value="manual">Manuálně</option>
                  </select>
                </div>
              </div>

              {/* Priority + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-trail-text mb-1">
                    Priorita *
                  </label>
                  <select
                    name="priority"
                    required
                    defaultValue={editingSubscription?.priority?.toString() || '2'}
                    className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
                  >
                    <option value="1">1 - Kritické / Nutné</option>
                    <option value="2">2 - Standard</option>
                    <option value="3">3 - Zbytné</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-trail-text mb-1">
                    Kategorie
                  </label>
                  <select
                    name="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
                  >
                    <option value="">-- Vybrat --</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__custom__">+ Vlastní...</option>
                  </select>
                  {selectedCategory === '__custom__' && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Název kategorie"
                      className="w-full mt-2 px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
                    />
                  )}
                </div>
              </div>

              {/* Next Billing Date */}
              <div>
                <label className="block text-sm font-medium text-trail-text mb-1">
                  Příští platba / Expirace
                </label>
                <input
                  type="date"
                  name="next_billing_date"
                  defaultValue={editingSubscription?.nextBillingDate || ''}
                  className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text hover:bg-trail-border/50 transition-colors"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Ukládám...' : 'Uložit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscriptions List */}
      {filteredSubscriptions.length === 0 ? (
        <div className="bg-trail-card rounded-xl p-12 text-center border border-trail-border/50">
          <CreditCard className="w-12 h-12 text-trail-muted mx-auto mb-3" />
          <p className="text-trail-muted mb-4">Zatím nemáte žádná předplatná</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-trail-accent hover:underline"
          >
            Přidat první službu
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscriptions.map(sub => (
            <SubscriptionCard key={sub.id} subscription={sub} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </div>
  )
}
