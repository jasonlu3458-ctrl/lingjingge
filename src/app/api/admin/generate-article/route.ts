import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase 未配置',
      }, { status: 500 });
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    const body = await request.json();
    const { notes, title: customTitle, tenantId = 'muxintang' } = body;

    if (!notes || typeof notes !== 'string' || notes.trim().length < 50) {
      return NextResponse.json({
        success: false,
        error: '笔记内容至少需要50字',
      }, { status: 400 });
    }

    const articleContent = await generateLongArticle(notes, customTitle);

    const title = customTitle || generateArticleTitle(notes);

    const { data: article, error } = await supabase
      .from('muxintang_articles')
      .insert({
        tenant_id: tenantId,
        title,
        content: articleContent,
        category: 'ebook',
        status: 'published',
        is_paid: true,
      })
      .select('id, title, content, created_at')
      .single();

    if (error) {
      console.error('[article] insert error:', error);
      return NextResponse.json({
        success: false,
        error: '保存文章失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        created_at: article.created_at,
      },
    });
  } catch (error) {
    console.error('[article] exception:', error);
    return NextResponse.json({
      success: false,
      error: '生成文章失败',
    }, { status: 500 });
  }
}

async function generateLongArticle(notes: string, customTitle?: string): Promise<string> {
  const apiKey = process.env.DIFY_LONG_ARTICLE_API_KEY || process.env.DIFY_API_KEY || process.env.NEXT_PUBLIC_DIFY_API_KEY;
  
  if (!apiKey) {
    console.warn('[article] no Dify API key, returning mock');
    return generateMockArticle(notes, customTitle);
  }

  try {
    const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');

    const prompt = `你是一位资深的传统文化作家，擅长将碎片化的笔记整理成结构完整、语言流畅的长篇文章。

请根据以下笔记内容，生成一篇完整的文章：

${notes}

文章要求：
1. 结构清晰，包含引言、主体章节和结语
2. 语言优美，符合传统文化韵味，使用恰当的比喻和典故
3. 内容连贯，逻辑严密
4. 篇幅适中（约1500-2000字）
5. 使用 Markdown 格式，包含合适的标题层级
6. 如果提供了标题，请以此标题为准；否则自行拟定一个合适的标题

输出格式：只输出文章内容，包含 Markdown 格式。`;

    const res = await fetch(`${baseUrl}/v1/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: prompt,
        response_mode: 'blocking',
        user: 'lingjingge-article',
      }),
    });

    if (!res.ok) {
      console.warn('[article] Dify request failed:', res.status);
      return generateMockArticle(notes, customTitle);
    }

    const data = await res.json();
    return data?.answer?.trim() || generateMockArticle(notes, customTitle);
  } catch (e) {
    console.warn('[article] Dify exception:', e);
    return generateMockArticle(notes, customTitle);
  }
}

function generateArticleTitle(notes: string): string {
  const lines = notes.split('\n').filter(l => l.trim());
  const firstLine = lines[0]?.slice(0, 30) || '阿阇梨开示录';
  return `${firstLine}...`;
}

function generateMockArticle(notes: string, customTitle?: string): string {
  const title = customTitle || '阿阇梨年度开示录';
  
  return `# ${title}

## 引言

岁月流转，时节更替。在这个快节奏的时代，我们常常忙碌于琐事，忘记了停下来聆听内心的声音。阿阇梨的开示，如同暗夜中的一盏明灯，照亮我们前行的道路。

## 一、静心之道

静心，是修行的第一步。《大学》云："知止而后有定，定而后能静，静而后能安，安而后能虑，虑而后能得。"在喧嚣的尘世中，保持一颗宁静的心，是何等珍贵。

${notes.slice(0, 500)}...

## 二、处世智慧

人生在世，难免遇到种种境遇。无论是顺境还是逆境，都是修行的机会。正如古人所说："静坐常思己过，闲谈莫论人非。"在与人交往中，保持谦逊和包容，是一种智慧。

## 三、生命感悟

生命是一场旅程，每个人都在寻找属于自己的答案。在这个过程中，我们经历欢笑与泪水，收获成长与感悟。阿阇梨常说："心之所向，牧之以道。"跟随内心的指引，走自己的路，便是最好的修行。

## 结语

愿这些开示能够陪伴你走过人生的每一个阶段。在未来的日子里，愿你保持一颗善良的心，善待自己，善待他人。愿你在传统文化的滋养中，找到内心的宁静与力量。

---

*本文由阿阇梨根据多年修行心得整理而成，希望能够带给读者一些启发和感悟。*`;
}
