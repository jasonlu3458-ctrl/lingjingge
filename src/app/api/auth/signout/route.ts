import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { isMockSupabaseEnabled } from '@/lib/mock-supabase';

/**
 * 退出登录 API
 * - 真 Supabase:调用 supabase.auth.signOut() 后清掉所有 sb-* cookie
 * - Mock 模式:不操作服务端,客户端 mock 层会清 localStorage 持久化标志
 *
 * 支持 GET(方便用户手动浏览器地址栏触发)和 POST(前端代码触发)
 */
async function doSignOut(): Promise<NextResponse> {
  const isMock = isMockSupabaseEnabled();
  const cookieStore = cookies();

  if (!isMock) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && key) {
        const supabase = createServerClient(url, key, {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        });
        await supabase.auth.signOut();
      }
    } catch (e) {
      // 忽略服务端 signOut 异常,继续清理 cookie
      console.error('[signout] supabase.auth.signOut 失败:', e);
    }

    // 清掉所有 sb-* / supabase-* 相关 cookie
    const all = cookieStore.getAll();
    for (const c of all) {
      if (c.name.startsWith('sb-') || c.name.includes('supabase') || c.name.includes('auth-token')) {
        try {
          cookieStore.set({ name: c.name, value: '', maxAge: 0, path: '/' });
        } catch {}
      }
    }
  }

  return NextResponse.json({ ok: true, mode: isMock ? 'mock' : 'real' });
}

export async function POST(_req: NextRequest) {
  return doSignOut();
}

export async function GET(_req: NextRequest) {
  // 允许直接浏览器地址栏访问触发,跳转回首页
  const res = await doSignOut();
  return NextResponse.redirect(new URL('/', _req.url));
}
