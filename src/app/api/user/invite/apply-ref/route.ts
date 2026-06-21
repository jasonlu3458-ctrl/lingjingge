import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/invite/apply-ref
 * Body: { ref: string (邀请人 userId) }
 *
 * 把当前登录用户的 profiles.invited_by 设为 ref（仅当当前为 null 时，避免覆盖）
 * 由 signup / login 成功后调用
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, mock: true });
  }

  try {
    const { ref } = (await request.json().catch(() => ({}))) as { ref?: string };
    if (!ref || typeof ref !== 'string') {
      return NextResponse.json({ ok: false, error: '缺少 ref' }, { status: 400 });
    }
    // 简单 UUID 校验
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)) {
      return NextResponse.json({ ok: false, error: 'ref 格式不正确' }, { status: 400 });
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
      },
    );
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 });
    }

    // 禁止自我邀请
    if (user.id === ref) {
      return NextResponse.json({ ok: false, error: '不能邀请自己' }, { status: 400 });
    }

    const supabase = createClient();
    // 仅当 invited_by 为空时写入（不覆盖）
    const { error: upErr } = await supabase
      .from('profiles')
      .update({ invited_by: ref })
      .eq('id', user.id)
      .is('invited_by', null);

    if (upErr) {
      // 字段不存在 → 静默
      if (upErr.code === '42703' || /does not exist/i.test(upErr.message)) {
        return NextResponse.json({ ok: true, mock: true });
      }
      throw upErr;
    }

    return NextResponse.json({ ok: true, invited_by: ref });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || '写入失败' }, { status: 500 });
  }
}
