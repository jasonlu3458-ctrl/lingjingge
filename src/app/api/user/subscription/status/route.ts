import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * GET /api/user/subscription/status
 * 返回当前登录用户的会员订阅状态
 *
 * 响应：{
 *   role,            // 'free' | 'monthly' | 'yearly' | 'admin'
 *   start_date,      // ISO string | null
 *   end_date,        // ISO string | null
 *   status,          // 'active' | 'canceled' | 'expired' | 'inactive'
 *   is_expired       // 布尔：end_date 早于今天
 * }
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase 未配置' },
      { status: 503 }
    );
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, subscription_start, subscription_end, subscription_status')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const role = profile?.role || 'free';
  const start_date = profile?.subscription_start || null;
  const end_date = profile?.subscription_end || null;
  const rawStatus = profile?.subscription_status || 'inactive';

  // 惰性降级：end_date 已过 → 实际是 expired
  let is_expired = false;
  if (end_date) {
    is_expired = new Date(end_date).getTime() < Date.now();
  }
  const status = is_expired ? 'expired' : rawStatus;

  return NextResponse.json({
    role,
    start_date,
    end_date,
    status,
    is_expired,
  });
}
