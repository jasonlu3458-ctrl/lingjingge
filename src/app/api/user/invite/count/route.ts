import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/invite/count
 * 返回：
 *   - count: 当前用户成功邀请的人数（profiles.invited_by = user.id）
 *   - reward_claimed: 是否已领取过当前阶梯的奖励（简化：profiles.reward_claimed）
 *   - invited_by: 当前用户的邀请人 id
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      count: 0,
      reward_claimed: false,
      invited_by: null,
      mock: true,
    });
  }

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

  try {
    const supabase = createClient();

    // 我邀请的人数
    const { count, error: cErr } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('invited_by', user.id);

    if (cErr) {
      // invited_by 列不存在 → 降级
      if (cErr.code === '42703' || /does not exist/i.test(cErr.message)) {
        return NextResponse.json({
          ok: true,
          count: 0,
          reward_claimed: false,
          invited_by: null,
          mock: true,
        });
      }
      throw cErr;
    }

    // 我自己的 reward_claimed
    const { data: me } = await supabase
      .from('profiles')
      .select('reward_claimed, invited_by')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      ok: true,
      count: count || 0,
      reward_claimed: Boolean(me?.reward_claimed),
      invited_by: me?.invited_by || null,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 });
  }
}
