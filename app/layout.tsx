import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TrailNotes | Dev Dashboard',
  description: 'Track your programming ideas and manage deployments',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#1e293b',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-trail-bg min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
