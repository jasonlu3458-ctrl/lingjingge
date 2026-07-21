import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ ebooks: [] });
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id') || 'muxintang';

    const { data: ebooks, error } = await supabase
      .from('muxintang_articles')
      .select('id, title, content, created_at, is_paid')
      .eq('tenant_id', tenantId)
      .eq('category', 'ebook')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ebooks] GET error:', error);
      return NextResponse.json({ ebooks: [] });
    }

    return NextResponse.json({ 
      ebooks: ebooks?.map((e: any) => ({
        id: e.id,
        title: e.title,
        preview: e.content?.slice(0, 100) + '...',
        created_at: e.created_at,
        is_paid: e.is_paid,
      })) || [],
    });
  } catch (error) {
    console.error('[ebooks] GET exception:', error);
    return NextResponse.json({ ebooks: [] });
  }
}
