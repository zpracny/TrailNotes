'use client'

import { useState } from 'react'
import { toggleSubscriptionActive, deleteSubscription } from '@/actions/subscriptions'
import type { SubscriptionOverview } from '@/lib/supabase/types'
import { RefreshCw, Trash2, Power, Calendar, Pencil } from 'lucide-react'

interface SubscriptionCardProps {
  subscription: SubscriptionOverview
  onEdit?: (subscription: SubscriptionOverview) => void
}

const priorityStyles = {
  1: 'border-l-4 border-l-red-500 bg-red-500/5',
  2: 'border-l-4 border-l-trail-accent',
  3: 'border-l-4 border-l-emerald-500/50 bg-emerald-500/5',
}

const priorityLabels = {
  1: 'Kritické',
  2: 'Standard',
  3: 'Zbytné',
}

const currencySymbols: Record<string, string> = {
  CZK: 'Kč',
  EUR: '€',
  USD: '$',
}

export function SubscriptionCard({ subscription, onEdit }: SubscriptionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleActive = async () => {
    setIsToggling(true)
    await toggleSubscriptionActive(subscription.id, !subscription.is_active)
    setIsToggling(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Smazat předplatné "${subscription.name}"?`)) return
    setIsDeleting(true)
    await deleteSubscription(subscription.id)
  }

  const formatOriginalPrice = () => {
    const symbol = currencySymbols[subscription.currency] || subscription.currency
    const freq = subscription.frequency === 'yearly' ? '/rok' : '/měs'
    return `${subscription.amount} ${symbol}${freq}`
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  const isExpiringSoon = () => {
    if (!subscription.next_billing_date) return false
    const date = new Date(subscription.next_billing_date)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays >= 0
  }

  return (
    <div
      className={`bg-trail-card rounded-xl p-4 shadow-md transition-all ${
        priorityStyles[subscription.priority as 1 | 2 | 3]
      } ${!subscription.is_active ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-trail-text truncate">{subscription.name}</h3>
            {subscription.payment_type === 'automatic' && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                <RefreshCw className="w-3 h-3" />
                Auto
              </span>
            )}
          </div>

          {subscription.category && (
            <span className="inline-block px-2 py-0.5 bg-trail-border/50 text-trail-muted rounded text-xs mb-2">
              {subscription.category}
            </span>
          )}

          <div className="space-y-1 text-sm">
            <div className="text-trail-muted">
              {formatOriginalPrice()}
            </div>
            <div className="text-lg font-bold text-trail-accent">
              {subscription.monthly_cost_czk?.toLocaleString('cs-CZ')} Kč/měs
            </div>
          </div>

          {subscription.next_billing_date && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${
              isExpiringSoon() ? 'text-amber-400' : 'text-trail-muted'
            }`}>
              <Calendar className="w-3 h-3" />
              {formatDate(subscription.next_billing_date)}
              {isExpiringSoon() && <span className="font-medium">(brzy!)</span>}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className={`text-xs px-2 py-1 rounded ${
            subscription.priority === 1
              ? 'bg-red-500/20 text-red-400'
              : subscription.priority === 3
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-trail-border text-trail-muted'
          }`}>
            {priorityLabels[subscription.priority as 1 | 2 | 3]}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-trail-border/30">
        {onEdit && (
          <button
            onClick={() => onEdit(subscription)}
            className="p-1.5 rounded hover:bg-trail-border/50 text-trail-muted hover:text-trail-text transition-colors"
            title="Upravit"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleToggleActive}
          disabled={isToggling}
          className={`p-1.5 rounded transition-colors ${
            subscription.is_active
              ? 'hover:bg-amber-600/30 text-trail-muted hover:text-amber-400'
              : 'hover:bg-emerald-600/30 text-trail-muted hover:text-emerald-400'
          } disabled:opacity-50`}
          title={subscription.is_active ? 'Deaktivovat' : 'Aktivovat'}
        >
          <Power className="w-4 h-4" />
        </button>
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
  )
}
