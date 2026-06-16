import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/consent
 * body: { version?: string }
 * 记录用户同意免责声明的时间戳到 profiles 表（用于法律证据）
 * - 未登录用户：返回 200 但不写库（匿名仍可使用，只是没记录）
 * - 登录用户：upsert consent_given_at + consent_version
 */
export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // 匿名：仅返回成功（前端已写 localStorage）
    return NextResponse.json({ ok: true, anonymous: true });
  }

  let version = 'v1.0';
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body.version === 'string' && body.version.trim()) {
      version = body.version.trim();
    }
  } catch {}

  const { error } = await supabase
    .from('profiles')
    .update({
      consent_given_at: new Date().toISOString(),
      consent_version: version,
    })
    .eq('id', user.id);

  if (error) {
    // 字段不存在（迁移未跑）→ 不阻塞前端
    const missing = /column .* does not exist/i.test(error.message);
    if (missing) {
      return NextResponse.json({ ok: true, warning: 'consent columns missing, run migration 008' });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, version, at: new Date().toISOString() });
}
