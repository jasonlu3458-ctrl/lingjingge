import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 获取用户会话
  const { data: { user } } = await supabase.auth.getUser()

  // 如果用户已登录，更新响应中的 cookies
  if (user) {
    // 刷新会话
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // session 已经通过 cookies 自动处理
    }
  }

  return response
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/pricing',
    '/api/:path*',
  ],
}