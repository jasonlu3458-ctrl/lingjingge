export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { requireAdminAuth, isAuthError } from '@/lib/admin-auth';
import { PromotionUpdateSchema, parseRequestBody } from '@/lib/validators/api-schemas';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // P0 安全加固
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

    const body = await request.json();

    // Zod 校验：拒绝脏数据进入数据库
    const parsed = parseRequestBody(PromotionUpdateSchema, body);
    if (parsed instanceof NextResponse) return parsed;
    const { name, price, description, category, status } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.discount_value = price;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.product_id = category;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 });
    }

    let scopedQuery = supabase.from('promotions').update(updateData).eq('id', params.id);
    if (auth.tenantId) {
      scopedQuery = scopedQuery.eq('tenant_id', auth.tenantId);
    }

    const { error } = await scopedQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // P0 安全加固
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

    let scopedQuery = supabase.from('promotions').delete().eq('id', params.id);
    if (auth.tenantId) {
      scopedQuery = scopedQuery.eq('tenant_id', auth.tenantId);
    }

    const { error } = await scopedQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}