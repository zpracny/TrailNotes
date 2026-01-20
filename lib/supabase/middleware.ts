import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

type CookieToSet = {
  name: string
  value: string
  options?: Partial<ResponseCookie>
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userEmail = user?.email

  // Protected routes (require login)
  const protectedRoutes = ['/dashboard', '/ideas', '/deployments', '/admin']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect to login if not authenticated
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Admin route - only for admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (userEmail !== ADMIN_EMAIL) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Check whitelist for protected routes (except admin)
  if (isProtectedRoute && !request.nextUrl.pathname.startsWith('/admin') && user) {
    const isAdmin = userEmail === ADMIN_EMAIL

    if (!isAdmin) {
      // Check access mode
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'access_mode')
        .single()

      const accessMode = settingsData?.value || 'all'

      if (accessMode === 'whitelist') {
        // Check if user is in whitelist
        const { data: allowedData } = await supabase
          .from('allowed_users')
          .select('id')
          .eq('email', userEmail?.toLowerCase())
          .single()

        if (!allowedData) {
          const url = request.nextUrl.clone()
          url.pathname = '/access-denied'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  // Redirect logged-in users from login page
  if (request.nextUrl.pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
