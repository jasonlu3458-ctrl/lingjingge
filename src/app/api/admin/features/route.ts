export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireAdminAuth, isAuthError } from '@/lib/admin-auth';
import { FeaturesConfigUpdateSchema, parseRequestBody } from '@/lib/validators/api-schemas';
import { invalidateTenantConfig } from '@/lib/tenant-config-server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ extra_config: {} });
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    const cookieStore = cookies();
    const tenantId = cookieStore.get('tenant_id')?.value;

    if (!tenantId) {
      return NextResponse.json({ extra_config: {} });
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('extra_config')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ extra_config: {} });
    }

    return NextResponse.json({
      extra_config: tenant.extra_config || {},
    });
  } catch (error) {
    return NextResponse.json({ extra_config: {} });
  }
}

export async function POST(request: NextRequest) {
  try {
    // P0 安全加固：写入租户配置必须先校验 admin/acharya 身份
    const auth = await requireAdminAuth();
    if (isAuthError(auth)) return auth;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: 'Supabase config missing' }, { status: 500 });
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    // 优先使用 auth.tenantId（来自 admin 用户的会话），避免被请求头伪造
    const tenantId = auth.tenantId || cookies().get('tenant_id')?.value;

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID not found' }, { status: 400 });
    }

    const body = await request.json();

    // Zod 校验：只允许 5 个已知 feature flag，防止注入任意键
    const parsed = parseRequestBody(FeaturesConfigUpdateSchema, body);
    if (parsed instanceof NextResponse) return parsed;
    const { extra_config } = parsed.data;

    const { error } = await supabase
      .from('tenants')
      .update({ extra_config })
      .eq('id', tenantId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 失效进程内租户配置缓存
    invalidateTenantConfig(tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
