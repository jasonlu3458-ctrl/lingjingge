export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type ArticleType = 'article' | 'novel' | 'poem' | 'essay';
type ArticleStatus = 'draft' | 'published' | 'archived';

const ARTICLE_TYPES: ArticleType[] = ['article', 'novel', 'poem', 'essay'];
const ARTICLE_STATUSES: ArticleStatus[] = ['draft', 'published', 'archived'];

function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createServerClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    cookies: { getAll() { return []; }, setAll() { } },
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;

    let query = supabase
      .from('muxintang_user_articles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ articles: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '服务器错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 });
    }

    const body = await request.json();
    const { type, title, content, category, summary, cover_image, status } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }
    if (type && !ARTICLE_TYPES.includes(type)) {
      return NextResponse.json({ error: '类型无效' }, { status: 400 });
    }
    if (status && !ARTICLE_STATUSES.includes(status)) {
      return NextResponse.json({ error: '状态无效' }, { status: 400 });
    }

    const wordCount = content ? content.length : 0;

    const insertData: Record<string, unknown> = {
      type: type || 'article',
      category: category || 'life',
      title: title.trim(),
      content: content || '',
      summary: summary || '',
      cover_image: cover_image || null,
      status: status || 'draft',
      is_published: status === 'published',
      word_count: wordCount,
    };

    // 尝试关联租户
    try {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', 'muxintang')
        .maybeSingle();
      if (tenantData) {
        insertData.tenant_id = tenantData.id;
      }
    } catch {
      // 忽略
    }

    const { data, error } = await supabase
      .from('muxintang_user_articles')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, article: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '服务器错误' }, { status: 500 });
  }
}
