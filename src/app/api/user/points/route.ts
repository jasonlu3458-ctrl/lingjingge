import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/points
 * 返回当前用户的累计积分、是否今日已签到、连续签到天数
 *
 * - 表 user_points 不存在 / Supabase 未配置 → 返回 mock（0 积分、未签到、0 连续）
 * - 用户未登录 → 返回 401
 */
export async function GET() {
  // 1) Supabase 未配置 → mock
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: true,
      total_points: 0,
      signed_in_today: false,
      consecutive_days: 0,
      mock: true,
    });
  }

  // 2) 鉴权：必须登录
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

  // 3) 查表（service_role 绕过 RLS）
  try {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);

    // 累计积分
    const { data: points, error: pErr } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', user.id);

    if (pErr) {
      // 表不存在（42P01）等降级
      if (pErr.code === '42P01' || /does not exist/i.test(pErr.message)) {
        return NextResponse.json({
          success: true,
          total_points: 0,
          signed_in_today: false,
          consecutive_days: 0,
          mock: true,
        });
      }
      throw pErr;
    }

    const total = (points || []).reduce((s, r) => s + (r.points || 0), 0);

    // 今日是否已签到
    const { data: todayRow } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', user.id)
      .eq('sign_in_date', today)
      .maybeSingle();

    // 连续天数（简化：取最近 7 天 count）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startStr = sevenDaysAgo.toISOString().slice(0, 10);
    const { data: recent } = await supabase
      .from('user_points')
      .select('sign_in_date')
      .eq('user_id', user.id)
      .gte('sign_in_date', startStr)
      .lte('sign_in_date', today)
      .order('sign_in_date', { ascending: false });

    const consecutive = calcConsecutive(
      (recent?.map((r) => r.sign_in_date).filter((d): d is string => !!d) || []),
      today
    );

    return NextResponse.json({
      success: true,
      total_points: total,
      signed_in_today: Boolean(todayRow),
      consecutive_days: consecutive,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || '查询失败' }, { status: 500 });
  }
}

function calcConsecutive(dates: string[], today: string): number {
  // dates 倒序；计算从 today 开始连续出现的次数
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
