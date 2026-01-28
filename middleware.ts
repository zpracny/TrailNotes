import { neonAuthMiddleware } from '@neondatabase/auth/next/server'

export default neonAuthMiddleware({
  loginUrl: '/auth/sign-in',
})

export const config = {
  // Protect all routes under (protected) group
  matcher: [
    '/(protected)/:path*',
    '/dashboard/:path*',
    '/ideas/:path*',
    '/deployments/:path*',
    '/links/:path*',
    '/subscriptions/:path*',
    '/voice-notes/:path*',
    '/admin/:path*',
  ],
}
