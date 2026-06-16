import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

const SIGN_IN_POINTS = 5;
const SEVEN_DAY_BONUS = 30;

/**
 * POST /api/user/points/sign-in
 * 给当前登录用户签到 +5 积分。
 * - 连续 7 天额外奖励 +30。
 * - 今日已签到 → 409
 * - user_points 表不存在 → mock 模式：直接返回 +5
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      points_awarded: SIGN_IN_POINTS,
      total_points: SIGN_IN_POINTS,
      consecutive_days: 1,
      message: `${SIGN_IN_POINTS} 积分已到账（mock）`,
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
    return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const supabase = createClient();

    // 查今日是否已签到
    const { data: existing, error: e1 } = await supabase
      .from('user_points')
      .select('id')
      .eq('user_id', user.id)
      .eq('sign_in_date', today)
      .maybeSingle();

    if (e1 && (e1.code === '42P01' || /does not exist/i.test(e1.message))) {
      // 表不存在 → mock
      return NextResponse.json({
        ok: true,
        points_awarded: SIGN_IN_POINTS,
        total_points: SIGN_IN_POINTS,
        consecutive_days: 1,
        message: `${SIGN_IN_POINTS} 积分已到账（表未创建，已 mock）`,
        mock: true,
      });
    }

    if (existing) {
      return NextResponse.json(
        { ok: false, error: '今日已签到，明天再来' },
        { status: 409 }
      );
    }

    // 写入今日 +5
    const { error: insErr } = await supabase
      .from('user_points')
      .insert({ user_id: user.id, points: SIGN_IN_POINTS, sign_in_date: today });

    if (insErr) throw insErr;

    // 检查连续 7 天 → 奖励 30
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startStr = sevenDaysAgo.toISOString().slice(0, 10);
    const { data: recent } = await supabase
      .from('user_points')
      .select('sign_in_date')
      .eq('user_id', user.id)
      .gte('sign_in_date', startStr)
      .lte('sign_in_date', today);

    const consecutive = calcConsecutive(
      (recent?.map((r) => r.sign_in_date).filter((d): d is string => !!d) || []),
      today
    );
    let bonus = 0;
    if (consecutive > 0 && consecutive % 7 === 0) {
      bonus = SEVEN_DAY_BONUS;
      await supabase
        .from('user_points')
        .insert({ user_id: user.id, points: SEVEN_DAY_BONUS, sign_in_date: today });
    }

    // 累计积分
    const { data: allPoints } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', user.id);
    const total = (allPoints || []).reduce((s, r) => s + (r.points || 0), 0);

    return NextResponse.json({
      ok: true,
      points_awarded: SIGN_IN_POINTS + bonus,
      total_points: total,
      consecutive_days: consecutive,
      message: bonus > 0
        ? `签到成功 +${SIGN_IN_POINTS}；连续 7 天额外奖励 +${bonus} 🎉`
        : `签到成功 +${SIGN_IN_POINTS} 积分`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || '签到失败' }, { status: 500 });
  }
}

function calcConsecutive(dates: string[], today: string): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let n = 0;
  const cur = new Date(today + 'T00:00:00Z');
  while (true) {
    const key = cur.toISOString().slice(0, 10);
    if (set.has(key)) {
      n++;
      cur.setUTCDate(cur.getUTCDate() - 1);
    } else {
      break;
    }
  }
  return n;
}
