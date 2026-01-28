'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getDeployment, updateDeployment, deleteDeployment } from '@/actions/deployments'
import type { Deployment, Platform } from '@/lib/supabase/types'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'

const PLATFORMS: Platform[] = ['AWS Lambda', 'n8n', 'Raspberry Pi', 'Docker', 'Vercel', 'EC2']

const PLATFORM_ICONS: Record<Platform, string> = {
  'AWS Lambda': '⚡',
  'n8n': '🔄',
  'Raspberry Pi': '🍓',
  'Docker': '🐳',
  'Vercel': '▲',
  'EC2': '☁️',
}

export default function EditDeploymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [deployment, setDeployment] = useState<Deployment | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const loadDeployment = async () => {
      const data = await getDeployment(id)
      setDeployment(data)
      setSelectedPlatform((data.platform as Platform) || '')
    }
    loadDeployment()
  }, [id])

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    await updateDeployment(id, formData)
    router.push('/deployments')
  }

  const handleDelete = async () => {
    if (!confirm('Opravdu chceš smazat tuto službu?')) return
    setIsDeleting(true)
    await deleteDeployment(id)
    router.push('/deployments')
  }

  if (!deployment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trail-accent"></div>
      </div>
    )
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-trail-text">Upravit službu</h1>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Smazat
          </button>
        </div>

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
              defaultValue={deployment.name}
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
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
              defaultValue={deployment.project}
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent"
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
              defaultValue={deployment.urlIp || ''}
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent font-mono"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-trail-text mb-2">
              Stav
            </label>
            <select
              id="status"
              name="status"
              defaultValue={deployment.status ?? 'running'}
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text focus:ring-2 focus:ring-trail-accent focus:border-transparent"
            >
              <option value="running">🟢 Běží</option>
              <option value="stopped">🟡 Zastaveno</option>
              <option value="error">🔴 Chyba</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-trail-text mb-2">
              Popis
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={deployment.description || ''}
              className="w-full px-4 py-2.5 bg-trail-bg border border-trail-border rounded-lg text-trail-text placeholder-trail-muted focus:ring-2 focus:ring-trail-accent focus:border-transparent resize-none"
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
                <Save className="w-4 h-4" />
              )}
              Uložit změny
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
