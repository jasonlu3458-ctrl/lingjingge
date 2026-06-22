import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/activity/track
 * 轻量埋点接口：写 user_activities 表
 * body: { activity_type: string, duration_minutes?: number, metadata?: object }
 *
 *  - 未登录：返回 401（不抛错，前端 tracker 静默忽略）
 *  - Mock 模式：返回 200 mock=true，不写表
 *  - 失败：返回 200 ok=false（避免埋点污染主流程日志）
 */
export async function POST(req: Request) {
  // Mock 模式：直接返回
  if (process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true') {
    return NextResponse.json({ ok: true, mock: true });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Supabase 未配置' },
      { status: 200 }, // 不报错，前端静默
    );
  }

  let body: {
    activity_type?: string;
    duration_minutes?: number;
    metadata?: Record<string, unknown>;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'invalid json' }, { status: 200 });
  }

  const activity_type = (body.activity_type || '').trim();
  if (!activity_type) {
    return NextResponse.json({ success: false, error: 'activity_type required' }, { status: 200 });
  }

  // 限制枚举，避免被刷脏数据
  const ALLOWED = new Set([
    'sign_in',
    'meditation',
    'ask',
    'report',
    'check_in',
    'invite',
    'read',
    'subscribe',
    'tts_play',
  ]);
  if (!ALLOWED.has(activity_type)) {
    return NextResponse.json(
      { success: false, error: `unknown activity_type: ${activity_type}` },
      { status: 200 },
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
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    // 服务端 insert；用 upsert + onConflict 实现"同日同类型去重"
    // 注：supabase-js 对 nullable 列的 upsert 类型推断较严，用 any 兜底
    const { data, error } = await (supabase
      .from('user_activities') as any)
      .upsert(
        {
          user_id: user.id,
          activity_type,
          activity_date: new Date().toISOString().split('T')[0],
          duration_minutes: body.duration_minutes ?? null,
          metadata: body.metadata ?? null,
        },
        {
          onConflict: 'user_id,activity_date,activity_type',
          ignoreDuplicates: false, // 更新 metadata
        },
      )
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'server error' },
      { status: 200 },
    );
  }
}
