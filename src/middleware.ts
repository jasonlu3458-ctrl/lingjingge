import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 检查 Supabase 环境变量是否配置
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // 如果未配置 Supabase，直接返回响应
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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