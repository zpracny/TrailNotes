'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { signOut } from '@/actions/auth'
import { checkIsAdmin } from '@/actions/admin'
import {
  LayoutDashboard,
  Lightbulb,
  Server,
  LogOut,
  Menu,
  X,
  Mountain,
  Shield,
  Link2,
  CreditCard,
  Mic,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Přehled', icon: LayoutDashboard },
  { href: '/ideas', label: 'Nápady', icon: Lightbulb },
  { href: '/deployments', label: 'Služby', icon: Server },
  { href: '/subscriptions', label: 'Předplatné', icon: CreditCard },
  { href: '/voice-notes', label: 'Hlas', icon: Mic },
  { href: '/links', label: 'Odkazy', icon: Link2 },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin)
  }, [])

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-trail-card border-r border-trail-border flex-col">
        <div className="p-6 border-b border-trail-border">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-trail-accent/20 flex items-center justify-center">
              <Mountain className="w-6 h-6 text-trail-accent" />
            </div>
            <div>
              <h1 className="font-bold text-trail-text text-lg">TrailNotes</h1>
              <p className="text-xs text-trail-muted">Dev Dashboard</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    pathname.startsWith(href)
                      ? 'bg-trail-accent/20 text-trail-accent'
                      : 'text-trail-muted hover:bg-trail-border/50 hover:text-trail-text'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              </li>
            ))}
            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    pathname.startsWith('/admin')
                      ? 'bg-trail-accent/20 text-trail-accent'
                      : 'text-trail-muted hover:bg-trail-border/50 hover:text-trail-text'
                  )}
                >
                  <Shield className="w-5 h-5" />
                  Administrace
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className="p-4 border-t border-trail-border">
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-trail-muted hover:bg-red-600/20 hover:text-red-400 transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              Odhlásit se
            </button>
          </form>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-trail-card border-b border-trail-border">
        <div className="flex items-center justify-between p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Mountain className="w-6 h-6 text-trail-accent" />
            <span className="font-bold text-trail-text">TrailNotes</span>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-trail-border/50 text-trail-muted"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="absolute top-full left-0 right-0 bg-trail-card border-b border-trail-border shadow-lg">
            <ul className="p-4 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      pathname.startsWith(href)
                        ? 'bg-trail-accent/20 text-trail-accent'
                        : 'text-trail-muted hover:bg-trail-border/50 hover:text-trail-text'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                </li>
              ))}
              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      pathname.startsWith('/admin')
                        ? 'bg-trail-accent/20 text-trail-accent'
                        : 'text-trail-muted hover:bg-trail-border/50 hover:text-trail-text'
                    )}
                  >
                    <Shield className="w-5 h-5" />
                    Administrace
                  </Link>
                </li>
              )}
            </ul>
            <div className="p-4 border-t border-trail-border">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-trail-muted hover:bg-red-600/20 hover:text-red-400 transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  Odhlásit se
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
