import { clsx } from 'clsx'

interface TagChipProps {
  tag: string
  onRemove?: () => void
  size?: 'sm' | 'md'
}

const tagColors: Record<string, string> = {
  'n8n': 'bg-orange-600/80 text-orange-100',
  'AWS': 'bg-yellow-600/80 text-yellow-100',
  'TrailMetrics': 'bg-emerald-600/80 text-emerald-100',
  'TrailMeteo': 'bg-sky-600/80 text-sky-100',
  'Raspberry': 'bg-pink-600/80 text-pink-100',
  'bikepacking': 'bg-lime-600/80 text-lime-100',
  'Docker': 'bg-blue-600/80 text-blue-100',
  'Vercel': 'bg-violet-600/80 text-violet-100',
  'Lambda': 'bg-amber-600/80 text-amber-100',
}

function getTagColor(tag: string): string {
  const lowerTag = tag.toLowerCase()
  for (const [key, value] of Object.entries(tagColors)) {
    if (lowerTag.includes(key.toLowerCase())) {
      return value
    }
  }
  return 'bg-slate-600/80 text-slate-200'
}

export function TagChip({ tag, onRemove, size = 'sm' }: TagChipProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-full font-medium',
      getTagColor(tag),
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}>
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}

export const SUGGESTED_TAGS = [
  'n8n',
  'TrailMetrics',
  'TrailMeteo',
  'AWS',
  'Lambda',
  'Raspberry',
  'bikepacking',
  'Docker',
  'Vercel',
  'API',
  'automation',
  'monitoring',
]
