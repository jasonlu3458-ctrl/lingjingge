export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { requireAdminAuth, isAuthError } from '@/lib/admin-auth';

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
    const { slug, title, content, source, category } = body;

    const updateData: Record<string, unknown> = {};
    if (slug !== undefined) updateData.slug = slug;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (source !== undefined) updateData.source = source;
    if (category !== undefined) updateData.category = category;

    let scopedQuery = supabase.from('articles').update(updateData).eq('id', params.id);
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

    let scopedQuery = supabase.from('articles').delete().eq('id', params.id);
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