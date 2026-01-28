import { createAuthServer, neonAuthMiddleware } from '@neondatabase/auth/next/server'

export const authServer = createAuthServer()

export { neonAuthMiddleware }

// Helper to get current user in server actions
export async function getUser() {
  const { data } = await authServer.getSession()
  return data?.user ?? null
}

// Helper to require authentication - throws if not authenticated
export async function requireUser() {
  const user = await getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
