'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createDeployment } from '@/actions/deployments'
import type { Platform } from '@/lib/supabase/types'
import { ArrowLeft, Plus } from 'lucide-react'

const PLATFORMS: Platform[] = ['AWS Lambda', 'n8n', 'Raspberry Pi', 'Docker', 'Vercel', 'EC2']

const PLATFORM_ICONS: Record<Platform, string> = {
  'AWS Lambda': '⚡',
  'n8n': '🔄',
  'Raspberry Pi': '🍓',
  'Docker': '🐳',
  'Vercel': '▲',
  'EC2': '☁️',
}

export default function NewDeploymentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | ''>('')

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    await createDeployment(formData)
    router.push('/deployments')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/deployments"
          className="inline-flex items-center gap-2 text-trail-muted hover:text-trail-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět na služby
        </Link>
      </div>

      <div className="bg-trail-card rounded-xl border border-trail-border/50 p-6">
        <h1 className="text-2xl font-bold text-trail-text mb-6">Nová služba</h1>

        <form action={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-trail-text mb-2">
              Název *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
              placeholder="např. TrailMetrics Lambda"
            />
          </div>

          <div>
            <label htmlFor="project" className="block text-sm font-medium text-trail-text mb-2">
              Projekt *
            </label>
            <input
              type="text"
              id="project"
              name="project"
              required
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
              placeholder="např. TrailMetrics, TrailMeteo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-trail-text mb-2">
              Platforma
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATFORMS.map(platform => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setSelectedPlatform(platform)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                    selectedPlatform === platform
                      ? 'border-trail-accent bg-trail-accent/20 text-trail-text'
                      : 'border-trail-border bg-trail-bg text-trail-muted hover:border-trail-accent/50'
                  }`}
                >
                  <span className="text-lg">{PLATFORM_ICONS[platform]}</span>
                  <span className="text-sm">{platform}</span>
                </button>
              ))}
            </div>
            <input type="hidden" name="platform" value={selectedPlatform} />
          </div>

          <div>
            <label htmlFor="url_ip" className="block text-sm font-medium text-trail-text mb-2">
              URL / IP adresa
            </label>
            <input
              type="text"
              id="url_ip"
              name="url_ip"
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent font-mono"
              placeholder="např. lambda-url.aws.com, 192.168.1.100:5678"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-trail-text mb-2">
              Popis
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent resize-none"
              placeholder="Co tato služba dělá?"
            />
          </div>

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
              Vytvořit službu
            </button>
            <Link
              href="/deployments"
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
