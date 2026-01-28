'use client'

import Link from 'next/link'
import { StatusBadge } from './StatusBadge'
import { TagsEditor } from './TagsEditor'
import { LinksEditor } from './LinksEditor'
import { updateDeploymentStatus, deleteDeployment, pingDeployment, updateDeploymentTags, updateDeploymentLinks } from '@/actions/deployments'
import type { Deployment, DeploymentStatus } from '@/lib/supabase/types'
import { Pencil, Trash2, Copy, RefreshCw, Check } from 'lucide-react'
import { useState } from 'react'

interface DeploymentRowProps {
  deployment: Deployment
}

function formatLastPing(lastPing: Date | null): string {
  if (!lastPing) return 'Nikdy'
  const date = new Date(lastPing)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Právě teď'
  if (diffMins < 60) return `před ${diffMins}m`
  if (diffHours < 24) return `před ${diffHours}h`
  return `před ${diffDays}d`
}

function getPlatformIcon(platform: string | null): string {
  switch (platform) {
    case 'AWS Lambda': return '⚡'
    case 'n8n': return '🔄'
    case 'Raspberry Pi': return '🍓'
    case 'Docker': return '🐳'
    case 'Vercel': return '▲'
    case 'EC2': return '☁️'
    default: return '📦'
  }
}

export function DeploymentRow({ deployment }: DeploymentRowProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPinging, setIsPinging] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleStatusChange = async (newStatus: DeploymentStatus) => {
    await updateDeploymentStatus(deployment.id, newStatus)
  }

  const handleDelete = async () => {
    if (!confirm('Smazat tuto službu?')) return
    setIsDeleting(true)
    await deleteDeployment(deployment.id)
  }

  const handlePing = async () => {
    setIsPinging(true)
    await pingDeployment(deployment.id)
    setIsPinging(false)
  }

  const handleCopy = async () => {
    if (!deployment.urlIp) return
    await navigator.clipboard.writeText(deployment.urlIp)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <tr className="border-b border-trail-border/30 hover:bg-trail-card/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getPlatformIcon(deployment.platform)}</span>
          <div>
            <div className="font-medium text-trail-text">{deployment.name}</div>
            {deployment.description && (
              <div className="text-xs text-trail-muted line-clamp-1">{deployment.description}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-trail-muted">{deployment.project}</td>
      <td className="px-4 py-3">
        <span className="text-sm text-trail-muted">{deployment.platform || '-'}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-sm text-trail-muted font-mono truncate max-w-[150px]">
            {deployment.urlIp || '-'}
          </span>
          {deployment.urlIp && (
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-trail-border/50 text-trail-muted hover:text-trail-text transition-colors"
              title="Kopírovat URL/IP"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-trail-accent" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        <LinksEditor
          links={deployment.links || []}
          onSave={async (links) => {
            await updateDeploymentLinks(deployment.id, links)
          }}
        />
      </td>
      <td className="px-4 py-3">
        <TagsEditor
          tags={deployment.tags || []}
          onSave={async (tags) => {
            await updateDeploymentTags(deployment.id, tags)
          }}
        />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={(deployment.status as DeploymentStatus) ?? 'running'} type="deployment" />
      </td>
      <td className="px-4 py-3 text-sm text-trail-muted">
        {formatLastPing(deployment.lastPing)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <select
            value={deployment.status ?? 'running'}
            onChange={(e) => handleStatusChange(e.target.value as DeploymentStatus)}
            className="text-xs bg-trail-bg border border-trail-border rounded px-2 py-1 text-trail-text focus:outline-none focus:ring-1 focus:ring-trail-accent mr-1"
          >
            <option value="running">Běží</option>
            <option value="stopped">Zastaveno</option>
            <option value="error">Chyba</option>
          </select>
          <button
            onClick={handlePing}
            disabled={isPinging}
            className="p-1.5 rounded hover:bg-trail-accent/20 text-trail-muted hover:text-trail-accent transition-colors disabled:opacity-50"
            title="Ping"
          >
            <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href={`/deployments/${deployment.id}`}
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
      </td>
    </tr>
  )
}
