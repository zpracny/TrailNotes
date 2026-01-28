import { AuthView, authViewPaths } from '@neondatabase/auth/react'

export const dynamicParams = false

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }))
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>
}) {
  const { path } = await params

  return (
    <main className="min-h-screen flex items-center justify-center bg-trail-bg p-4">
      <div className="w-full max-w-md">
        <AuthView path={path} />
      </div>
    </main>
  )
}
