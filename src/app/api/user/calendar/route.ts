import { NextResponse } from 'next/server';
import { isSupabaseConfigured, createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/calendar
 * 返回当前用户最近 365 天的「活跃日」日期数组。
 *  - 用于 /tong/profile 的 GitHub 风格修行日历热力图
 *  - 活跃日定义为：当天有任意 user_activities 记录（去重）
 *  - Mock 模式：返回内置 60+ 天的演示数据，让本地能直接看到热力图
 */
export async function GET() {
  // —— Mock 模式：脱离真实 Supabase 也能展示 ——
  if (process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true') {
    return NextResponse.json({
      ok: true,
      mock: true,
      dates: generateMockDates(),
      user_id: 'mock-user-001',
    });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Supabase 未配置' },
      { status: 503 },
    );
  }

  try {
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
      },
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    // 最近 365 天
    const start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_activities')
      .select('activity_date')
      .eq('user_id', user.id)
      .gte('activity_date', start)
      .order('activity_date', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    // 去重日期
    const dates = Array.from(
      new Set((data || []).map((r) => r.activity_date as string)),
    );
    return NextResponse.json({ ok: true, dates, user_id: user.id });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'server error' },
      { status: 500 },
    );
  }
}

/**
 * 生成 mock 演示数据：过去 200 天内随机 60+ 天为活跃，
 * 且最近 14 天有连续打卡（方便看 streak）。
 */
function generateMockDates(): string[] {
  const out = new Set<string>();
  const today = new Date();
  // 最近 14 天：每天都有（连续 streak）
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.add(toYmd(d));
  }
  // 14-60 天：隔天 / 随机
  for (let i = 14; i < 60; i++) {
    if (Math.random() < 0.6) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      out.add(toYmd(d));
    }
  }
  // 60-200 天：稀疏
  for (let i = 60; i < 200; i++) {
    if (Math.random() < 0.25) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      out.add(toYmd(d));
    }
  }
  return Array.from(out).sort();
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
