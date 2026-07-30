export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { requireAdminAuth, isAuthError } from '@/lib/admin-auth';
import { ArticleCreateSchema, parseRequestBody } from '@/lib/validators/api-schemas';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ articles: [] });
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, slug, title, content, source, category, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ articles: [] });
    }

    return NextResponse.json({ articles: articles || [] });
  } catch (error) {
    return NextResponse.json({ articles: [] });
  }
}

export async function POST(request: NextRequest) {
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

    // Zod 校验
    const parsed = parseRequestBody(ArticleCreateSchema, body);
    if (parsed instanceof NextResponse) return parsed;
    const { slug, title, content, source, category } = parsed.data;

    const insertData: Record<string, unknown> = { slug, title, content };
    if (source !== undefined) insertData.source = source;
    if (category !== undefined) insertData.category = category;
    if (auth.tenantId) insertData.tenant_id = auth.tenantId;

    const { error } = await supabase
      .from('articles')
      .insert(insertData);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}