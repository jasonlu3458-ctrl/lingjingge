import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/invite/reward
 * 领取邀请奖励：
 *  - 至少邀请 1 人 → +7 天会员
 *  - 至少邀请 3 人 → 再 +30 天
 *  - 至少邀请 5 人 → 再 +90 天
 * 奖励通过延长 profiles.subscription_end 实现。
 * 已领取过（reward_claimed=true）则不再发，避免重复。
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      days_awarded: 7,
      message: '已到账 7 天会员（mock）',
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

    // 1) 查邀请人数
    const { count, error: cErr } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('invited_by', user.id);

    if (cErr) {
      if (cErr.code === '42703' || /does not exist/i.test(cErr.message)) {
        return NextResponse.json({
          ok: true,
          days_awarded: 0,
          message: '邀请字段未启用，已 mock',
          mock: true,
        });
      }
      throw cErr;
    }

    const invited = count || 0;
    if (invited < 1) {
      return NextResponse.json({ success: false, error: '尚未邀请到同修' }, { status: 400 });
    }

    // 2) 查自己 profile
    const { data: me, error: mErr } = await supabase
      .from('profiles')
      .select('reward_claimed, subscription_end, role')
      .eq('id', user.id)
      .single();
    if (mErr) throw mErr;

    if (me?.reward_claimed) {
      return NextResponse.json({ success: false, error: '已领取过邀请奖励' }, { status: 409 });
    }

    // 3) 计算奖励天数（阶梯式：1→7, 3→+30, 5→+90）
    let days = 0;
    if (invited >= 1) days += 7;
    if (invited >= 3) days += 30;
    if (invited >= 5) days += 90;

    // 4) 延长期限：subscription_end 在未来 + days；否则以今天为基
    const base = me?.subscription_end && new Date(me.subscription_end) > new Date()
      ? new Date(me.subscription_end)
      : new Date();
    base.setDate(base.getDate() + days);
    const newEnd = base.toISOString();

    const { error: uErr } = await supabase
      .from('profiles')
      .update({
        subscription_end: newEnd,
        reward_claimed: true,
        role: me?.role && me.role !== 'free' ? me.role : 'monthly',
      })
      .eq('id', user.id);

    if (uErr) throw uErr;

    return NextResponse.json({
      ok: true,
      days_awarded: days,
      subscription_end: newEnd,
      message: `已到账 ${days} 天会员，到期：${base.toLocaleDateString('zh-CN')}`,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '领取失败' }, { status: 500 });
  }
}
