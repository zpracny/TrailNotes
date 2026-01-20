import Link from 'next/link'
import { getIdeasStats } from '@/actions/ideas'
import { getDeploymentsStats } from '@/actions/deployments'
import { getIdeas } from '@/actions/ideas'
import { getDeployments } from '@/actions/deployments'
import { IdeaCard } from '@/components/IdeaCard'
import {
  Lightbulb,
  Server,
  Plus,
  CheckCircle2,
  Clock,
} from 'lucide-react'

export default async function DashboardPage() {
  const [ideasStats, deploymentsStats, ideas, deployments] = await Promise.all([
    getIdeasStats(),
    getDeploymentsStats(),
    getIdeas(),
    getDeployments(),
  ])

  const recentIdeas = ideas.slice(0, 3)
  const recentDeployments = deployments.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-trail-text">Přehled</h1>
          <p className="text-trail-muted">Souhrn nápadů a služeb</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/ideas/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nový nápad
          </Link>
          <Link
            href="/deployments/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-trail-card hover:bg-trail-border/50 text-trail-text border border-trail-border rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nová služba
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-trail-card rounded-xl p-5 border border-trail-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-trail-accent/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-trail-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-trail-text">{ideasStats.total}</p>
              <p className="text-sm text-trail-muted">Nápadů celkem</p>
            </div>
          </div>
        </div>

        <div className="bg-trail-card rounded-xl p-5 border border-trail-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-trail-text">{ideasStats.inProgress}</p>
              <p className="text-sm text-trail-muted">Rozpracované</p>
            </div>
          </div>
        </div>

        <div className="bg-trail-card rounded-xl p-5 border border-trail-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-lg">
              <Server className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-trail-text">{deploymentsStats.total}</p>
              <p className="text-sm text-trail-muted">Služeb celkem</p>
            </div>
          </div>
        </div>

        <div className="bg-trail-card rounded-xl p-5 border border-trail-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-trail-text">{deploymentsStats.running}</p>
              <p className="text-sm text-trail-muted">Běžících</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ideas Overview */}
        <div className="bg-trail-card rounded-xl border border-trail-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-trail-text flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-trail-accent" />
              Stav nápadů
            </h2>
            <Link href="/ideas" className="text-sm text-trail-accent hover:underline">
              Zobrazit vše
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-trail-muted">K řešení</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-trail-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-500 rounded-full"
                    style={{ width: `${ideasStats.total ? (ideasStats.todo / ideasStats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-trail-text font-medium w-8 text-right">{ideasStats.todo}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-trail-muted">Rozpracované</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-trail-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${ideasStats.total ? (ideasStats.inProgress / ideasStats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-trail-text font-medium w-8 text-right">{ideasStats.inProgress}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-trail-muted">Hotovo</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-trail-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${ideasStats.total ? (ideasStats.done / ideasStats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-trail-text font-medium w-8 text-right">{ideasStats.done}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deployments Overview */}
        <div className="bg-trail-card rounded-xl border border-trail-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-trail-text flex items-center gap-2">
              <Server className="w-5 h-5 text-trail-accent" />
              Stav služeb
            </h2>
            <Link href="/deployments" className="text-sm text-trail-accent hover:underline">
              Zobrazit vše
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-trail-muted flex items-center gap-2">
                <span className="text-emerald-400">🟢</span> Běží
              </span>
              <span className="text-trail-text font-medium">{deploymentsStats.running}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-trail-muted flex items-center gap-2">
                <span className="text-amber-400">🟡</span> Zastaveno
              </span>
              <span className="text-trail-text font-medium">{deploymentsStats.stopped}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-trail-muted flex items-center gap-2">
                <span className="text-red-400">🔴</span> Chyba
              </span>
              <span className="text-trail-text font-medium">{deploymentsStats.error}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Items */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Ideas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-trail-text">Poslední nápady</h2>
            <Link href="/ideas" className="text-sm text-trail-accent hover:underline">
              Zobrazit vše
            </Link>
          </div>
          <div className="space-y-3">
            {recentIdeas.length > 0 ? (
              recentIdeas.map(idea => (
                <IdeaCard key={idea.id} idea={idea} />
              ))
            ) : (
              <div className="bg-trail-card rounded-xl p-8 text-center border border-trail-border/50">
                <Lightbulb className="w-12 h-12 text-trail-muted mx-auto mb-3" />
                <p className="text-trail-muted">Zatím žádné nápady</p>
                <Link
                  href="/ideas/new"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Přidat první nápad
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Deployments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-trail-text">Poslední služby</h2>
            <Link href="/deployments" className="text-sm text-trail-accent hover:underline">
              Zobrazit vše
            </Link>
          </div>
          {recentDeployments.length > 0 ? (
            <div className="bg-trail-card rounded-xl border border-trail-border/50 overflow-hidden">
              <table className="w-full">
                <thead className="bg-trail-border/30">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-trail-muted uppercase">Název</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-trail-muted uppercase">Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeployments.map(dep => (
                    <tr key={dep.id} className="border-t border-trail-border/30">
                      <td className="px-4 py-3 text-trail-text">{dep.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-sm ${
                          dep.status === 'running' ? 'text-emerald-400' :
                          dep.status === 'error' ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {dep.status === 'running' ? '🟢' : dep.status === 'error' ? '🔴' : '🟡'}
                          {dep.status === 'running' ? 'Běží' : dep.status === 'error' ? 'Chyba' : 'Zastaveno'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-trail-card rounded-xl p-8 text-center border border-trail-border/50">
              <Server className="w-12 h-12 text-trail-muted mx-auto mb-3" />
              <p className="text-trail-muted">Zatím žádné služby</p>
              <Link
                href="/deployments/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-trail-accent hover:bg-trail-accent/80 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Přidat první službu
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="bg-trail-card rounded-xl border border-trail-border/50 p-5">
        <h3 className="font-semibold text-trail-text mb-3">Klávesové zkratky</h3>
        <div className="flex flex-wrap gap-4 text-sm text-trail-muted">
          <span><kbd className="px-2 py-1 bg-trail-border rounded font-mono">n</kbd> Nový nápad</span>
          <span><kbd className="px-2 py-1 bg-trail-border rounded font-mono">d</kbd> Nová služba</span>
          <span><kbd className="px-2 py-1 bg-trail-border rounded font-mono">p</kbd> Ping všech</span>
          <span><kbd className="px-2 py-1 bg-trail-border rounded font-mono">h</kbd> Přehled</span>
          <span><kbd className="px-2 py-1 bg-trail-border rounded font-mono">i</kbd> Nápady</span>
        </div>
      </div>
    </div>
  )
}
