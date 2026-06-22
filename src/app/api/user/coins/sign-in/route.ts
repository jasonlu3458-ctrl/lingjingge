import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

const SIGN_IN_REWARD = 10;   // 每日签到奖励（灵境币）
const REWARD_NOTE = '每日签到 +10 灵境币';

/**
 * POST /api/user/coins/sign-in
 *
 * 每日签到 → +10 灵境币。
 * - 今日已签到（last_sign_in_date == today）→ 409
 * - 表 user_coins 不存在 / Supabase 未配置 → mock 模式返回 +10
 * - 钱包未创建 → 自动创建（balance=10, last_sign_in_date=today）
 * - 钱包已存在 → balance += 10, last_sign_in_date = today
 *
 * 并发安全：
 *   使用"先 SELECT 判今日"，后用"条件 UPDATE"（带 `ne` 谓词）兜底——
 *   两个请求同时打进来，后到的会拿到 affected=0，从而返回 409。
 */
export async function POST() {
  // 1) mock 模式（Supabase 未配置）
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: true,
      balance: SIGN_IN_REWARD,
      coins_awarded: SIGN_IN_REWARD,
      signed_in_today: true,
      message: `${SIGN_IN_REWARD} 灵境币已到账（mock）`,
      mock: true,
    });
  }

  // 2) 鉴权
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

    // 3) 读当前钱包
    const { data: existing, error: readErr } = await supabase
      .from('user_coins')
      .select('balance, last_sign_in_date')
      .eq('user_id', user.id)
      .maybeSingle();

    // 表不存在 → mock
    if (readErr && (readErr.code === '42P01' || /does not exist/i.test(readErr.message))) {
      return NextResponse.json({
        success: true,
        balance: SIGN_IN_REWARD,
        coins_awarded: SIGN_IN_REWARD,
        signed_in_today: true,
        message: `${SIGN_IN_REWARD} 灵境币已到账（表未创建，已 mock）`,
        mock: true,
      });
    }
    if (readErr) throw readErr;

    // 4) 已签到判定（前置：保护正常路径）
    if (existing && existing.last_sign_in_date === today) {
      return NextResponse.json(
        { ok: false, error: '今日已签到，明天再来', balance: existing.balance },
        { status: 409 }
      );
    }

    // 5) 钱包不存在 → INSERT
    if (!existing) {
      const { data: ins, error: insErr } = await supabase
        .from('user_coins')
        .insert({
          user_id: user.id,
          balance: SIGN_IN_REWARD,
          last_sign_in_date: today,
        })
        .select('balance, last_sign_in_date')
        .single();
      if (insErr) {
        // 并发：另一个请求先 INSERT 了 → 取一次最新值判断
        if (insErr.code === '23505') {
          const { data: again } = await supabase
            .from('user_coins')
            .select('balance, last_sign_in_date')
            .eq('user_id', user.id)
            .single();
          if (again?.last_sign_in_date === today) {
            return NextResponse.json(
              { ok: false, error: '今日已签到，明天再来', balance: again.balance },
              { status: 409 }
            );
          }
        }
        throw insErr;
      }
      return NextResponse.json({
        success: true,
        balance: ins?.balance ?? SIGN_IN_REWARD,
        coins_awarded: SIGN_IN_REWARD,
        signed_in_today: true,
        last_sign_in_date: today,
        message: `${SIGN_IN_REWARD} 灵境币已到账`,
        note: REWARD_NOTE,
        mock: false,
      });
    }

    // 6) 钱包存在 → 条件 UPDATE（带 ne 谓词做并发兜底）
    const { data: updated, error: updErr } = await supabase
      .from('user_coins')
      .update({
        balance: (existing.balance ?? 0) + SIGN_IN_REWARD,
        last_sign_in_date: today,
      })
      .eq('user_id', user.id)
      .neq('last_sign_in_date', today) // 并发兜底
      .select('balance, last_sign_in_date')
      .maybeSingle();
    if (updErr) throw updErr;

    if (!updated) {
      // 另一个请求抢到了，返回 409
      const { data: latest } = await supabase
        .from('user_coins')
        .select('balance, last_sign_in_date')
        .eq('user_id', user.id)
        .single();
      return NextResponse.json(
        { ok: false, error: '今日已签到，明天再来', balance: latest?.balance ?? 0 },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: updated.balance,
      coins_awarded: SIGN_IN_REWARD,
      signed_in_today: true,
      last_sign_in_date: today,
      message: `${SIGN_IN_REWARD} 灵境币已到账`,
      note: REWARD_NOTE,
      mock: false,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
