import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/me
 * 返回当前登录用户的基础资料（用于分享海报等场景）
 *   - user_id
 *   - nickname / display_name
 *   - bazi_summary
 *   - invited_by
 *
 * 字段不存在时降级返回 mock，不报错
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, mock: true });
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
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, display_name, bazi_summary, invited_by')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      // 字段缺失降级：返回 user.id 即可，海报仍可用
      if (error.code === '42703' || /does not exist/i.test(error.message)) {
        return NextResponse.json({
          success: true,
          mock: true,
          user_id: user.id,
          profile: {
            id: user.id,
            nickname: null,
            display_name: null,
            bazi_summary: null,
            invited_by: null,
          },
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      user_id: user.id,
      profile: data ?? {
        id: user.id,
        nickname: null,
        display_name: null,
        bazi_summary: null,
        invited_by: null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 });
  }
}
