// ============================================================
// src/lib/admin-auth.ts
// 统一的后台 API 鉴权工具（P0 安全加固）
// ------------------------------------------------------------
//  - 用 anon key + user cookie 调用 supabase.auth.getUser()，
//    不可用 service_role（会绕过 RLS 导致鉴权失效）。
//  - 校验当前登录用户的 profiles.role 是否为 admin / acharya。
//  - 用法：
//      const auth = await requireAdminAuth();
//      if (auth instanceof NextResponse) return auth;
//      // auth.user / auth.profile / auth.tenantId 可继续使用
// ============================================================

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export type AdminRole = 'admin' | 'acharya';

export interface AdminAuthContext {
  user: User;
  profile: { id: string; role: AdminRole; [key: string]: unknown };
  supabase: SupabaseClient;
  tenantId: string | null;
}

const ANON_ROLES: AdminRole[] = ['admin', 'acharya'];

function buildServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // 在某些只读上下文（middleware / static rendering）中无法 set，
          // 这里静默忽略；不会影响 auth.getUser 的读取。
        }
      },
    },
  });
}

/**
 * 校验当前请求是否来自已登录的 admin/acharya。
 *  - 未登录：返回 401 NextResponse
 *  - 已登录但角色不符：返回 403 NextResponse
 *  - 校验通过：返回 { user, profile, supabase, tenantId }
 */
export async function requireAdminAuth(): Promise<AdminAuthContext | NextResponse> {
  const supabase = buildServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase 未配置（缺少 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY）' },
      { status: 500 }
    );
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Forbidden: profile not found' }, { status: 403 });
  }

  const role = (profile as { role?: string }).role;
  if (!role || !ANON_ROLES.includes(role as AdminRole)) {
    return NextResponse.json({ error: 'Forbidden: 需要 admin 或 acharya 角色' }, { status: 403 });
  }

  const tenantId = cookies().get('tenant_id')?.value ?? null;

  return {
    user,
    profile: profile as AdminAuthContext['profile'],
    supabase,
    tenantId,
  };
}

/**
 * 便捷类型守卫：判断返回值是否为 NextResponse（即未授权）。
 */
export function isAuthError(result: AdminAuthContext | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
