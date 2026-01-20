'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { pingAllDeployments } from '@/actions/deployments'

export function KeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault()
          router.push('/ideas/new')
          break
        case 'd':
          e.preventDefault()
          router.push('/deployments/new')
          break
        case 'p':
          e.preventDefault()
          await pingAllDeployments()
          break
        case 'h':
          e.preventDefault()
          router.push('/dashboard')
          break
        case 'i':
          e.preventDefault()
          router.push('/ideas')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  return null
}
