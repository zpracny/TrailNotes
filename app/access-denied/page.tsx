import Link from 'next/link'
import { ShieldX, ArrowLeft } from 'lucide-react'
import { signOut } from '@/actions/auth'

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-trail-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/20 mb-6">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-trail-text mb-3">
          Přístup odepřen
        </h1>

        <p className="text-trail-muted mb-8">
          Nemáš oprávnění k přístupu do této aplikace.
          Kontaktuj administrátora pro získání přístupu.
        </p>

        <div className="flex flex-col gap-3">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full px-4 py-3 bg-trail-card hover:bg-trail-border/50 text-trail-text border border-trail-border rounded-lg font-medium transition-colors"
            >
              Odhlásit se a zkusit jiný účet
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
