import { clsx } from 'clsx'
import type { IdeaStatus, DeploymentStatus } from '@/lib/supabase/types'

interface StatusBadgeProps {
  status: IdeaStatus | DeploymentStatus
  type: 'idea' | 'deployment'
}

const ideaStyles: Record<IdeaStatus, string> = {
  'todo': 'bg-slate-600 text-slate-200',
  'in-progress': 'bg-amber-600 text-amber-100',
  'done': 'bg-emerald-600 text-emerald-100',
}

const deploymentStyles: Record<DeploymentStatus, string> = {
  'running': 'bg-emerald-600 text-emerald-100',
  'stopped': 'bg-amber-600 text-amber-100',
  'error': 'bg-red-600 text-red-100',
}

const ideaLabels: Record<IdeaStatus, string> = {
  'todo': 'K řešení',
  'in-progress': 'Rozpracované',
  'done': 'Hotovo',
}

const deploymentLabels: Record<DeploymentStatus, string> = {
  'running': 'Běží',
  'stopped': 'Zastaveno',
  'error': 'Chyba',
}

const deploymentIcons: Record<DeploymentStatus, string> = {
  'running': '🟢',
  'stopped': '🟡',
  'error': '🔴',
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  if (type === 'idea') {
    return (
      <span className={clsx(
        'px-2.5 py-1 rounded-full text-xs font-medium',
        ideaStyles[status as IdeaStatus]
      )}>
        {ideaLabels[status as IdeaStatus]}
      </span>
    )
  }

  return (
    <span className={clsx(
      'px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5',
      deploymentStyles[status as DeploymentStatus]
    )}>
      <span>{deploymentIcons[status as DeploymentStatus]}</span>
      {deploymentLabels[status as DeploymentStatus]}
    </span>
  )
}
