export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { requireAdminAuth, isAuthError } from '@/lib/admin-auth';
import { UpdateTenantSchema, parseRequestBody } from '@/lib/validators/api-schemas';
import { invalidateTenantConfig } from '@/lib/tenant-config-server';

export async function PATCH(request: NextRequest) {
  try {
    // P0 安全加固：租户配置写入必须先校验 admin 身份
    const auth = await requireAdminAuth();
    if (isAuthError(auth)) return auth;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 });
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    // 必须从 session 取 tenantId，不能从 cookie 读（防止跨租户越权）
    const tenantId = auth.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: '租户 ID 未找到' }, { status: 400 });
    }

    const body = await request.json();

    // Zod 校验：.strict() 拒绝未声明字段
    const parsed = parseRequestBody(UpdateTenantSchema, body);
    if (parsed instanceof NextResponse) return parsed;
    const updateData = parsed.data;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 });
    }

    const { error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 失效进程内租户配置缓存，使下次请求立即生效
    invalidateTenantConfig(tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}