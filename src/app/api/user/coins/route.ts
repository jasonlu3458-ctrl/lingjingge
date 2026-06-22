import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/coins
 *
 * 返回当前登录用户的灵境币余额 + 今日是否已签到。
 *
 * - Supabase 未配置 → 返回 mock 0 余额（前端展示"未开通"）
 * - 用户未登录   → 401
 * - user_coins 表不存在 → mock 0（与原 user_points 路由保持一致）
 * - 钱包未创建 → 当作 0 余额
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      balance: 0,
      signed_in_today: false,
      last_sign_in_date: null,
      mock: true,
    });
  }

  // 鉴权
  const cookieStore = cookies();
  const supabaseAuth = createServerClient(
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
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_coins')
      .select('balance, last_sign_in_date')
      .eq('user_id', user.id)
      .maybeSingle();

    // 表不存在 → mock
    if (error && (error.code === '42P01' || /does not exist/i.test(error.message))) {
      return NextResponse.json({
        ok: true,
        balance: 0,
        signed_in_today: false,
        last_sign_in_date: null,
        mock: true,
      });
    }
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      balance: data?.balance ?? 0,
      signed_in_today: data?.last_sign_in_date === today,
      last_sign_in_date: data?.last_sign_in_date ?? null,
      mock: false,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
