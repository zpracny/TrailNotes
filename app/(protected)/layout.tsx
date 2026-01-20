import { Navigation } from '@/components/Navigation'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-trail-bg">
      <Navigation />
      <KeyboardShortcuts />
      <main className="md:ml-64 pt-16 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
