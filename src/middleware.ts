import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ Allow root path FIRST
  if (pathname === '/') {
    return NextResponse.next()
  }

  // ✅ Allow public routes
  const publicPaths = [
    '/login',
    '/register',
    '/api/auth',
    '/api/wordpress',
    '/_next',
    '/images',
    '/favicon.ico',
  ]

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // ✅ Check NextAuth session
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    // ✅ Redirect to login if no session
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  } catch (error) {
    console.error('❌ Middleware auth error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Supabase session refresh
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    await supabase.auth.getUser()
  } catch (error) {
    console.error('❌ Supabase session refresh error:', error)
  }

  return response
}

export const config = {
  matcher: [
    // ✅ More specific matcher
    '/dashboard/:path*',
    '/admin/:path*',
    '/staff/:path*',
    '/user/:path*',
    '/order/:path*',
    '/profile/:path*',
    '/support/:path*',
  ],
}