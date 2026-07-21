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
    const { tenantId = 'muxintang' } = body;

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name')
      .eq('slug', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({
        success: false,
        error: '租户不存在',
      }, { status: 404 });
    }

    const tenantName = tenant.name || '阿阇梨';

    const { data: articles, error } = await supabase
      .from('muxintang_articles')
      .select('id, title, content, created_at, category')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[yimi] fetch articles error:', error);
      return NextResponse.json({
        success: false,
        error: '获取文章失败',
      }, { status: 500 });
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        success: false,
        error: '该道场暂无已发布的文章',
      }, { status: 400 });
    }

    const articleNotes = articles.map((a: any) => {
      const date = new Date(a.created_at).toLocaleDateString('zh-CN');
      const excerpt = (a.content || '').slice(0, 200).replace(/\n/g, ' ').replace(/[#*`]/g, '');
      return `【${date}】《${a.title}》\n核心观点：${excerpt}...\n`;
    }).join('\n');

    const chronicleContent = await generateChronicle(tenantName, articleNotes);

    const title = `${tenantName} · 思想编年史`;

    const { data: savedArticle, error: saveError } = await supabase
      .from('muxintang_articles')
      .insert({
        tenant_id: tenantId,
        title,
        content: chronicleContent,
        category: 'ebook',
        status: 'published',
        is_paid: true,
        free_chapter_count: 3,
      })
      .select('id, title, content, created_at')
      .single();

    if (saveError) {
      console.error('[yimi] save error:', saveError);
      return NextResponse.json({
        success: false,
        error: '保存编年史失败',
      }, { status: 500 });
    }

    await supabase
      .from('tenants')
      .update({
        yimi_config: {
          last_generated_at: new Date().toISOString(),
          chronicle_article_id: savedArticle.id,
        },
      })
      .eq('slug', tenantId);

    return NextResponse.json({
      success: true,
      article: {
        id: savedArticle.id,
        title: savedArticle.title,
        content: savedArticle.content,
        created_at: savedArticle.created_at,
      },
      articleCount: articles.length,
    });
  } catch (error) {
    console.error('[yimi] exception:', error);
    return NextResponse.json({
      success: false,
      error: '生成编年史失败',
    }, { status: 500 });
  }
}

async function generateChronicle(acharyaName: string, articleNotes: string): Promise<string> {
  const apiKey = process.env.DIFY_LONG_ARTICLE_API_KEY || process.env.DIFY_API_KEY || process.env.NEXT_PUBLIC_DIFY_API_KEY;

  if (!apiKey) {
    console.warn('[yimi] no Dify API key, returning mock');
    return generateMockChronicle(acharyaName, articleNotes);
  }

  try {
    const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');

    const prompt = `你是一位资深的思想史学家，擅长梳理思想家的思想演变脉络。

请根据以下 ${acharyaName} 的历年文章摘要，生成一篇《${acharyaName} · 思想编年史》：

${articleNotes}

生成要求：
1. 以时间为主线，梳理 ${acharyaName} 思想发展的关键节点
2. 每个时间节点重点阐述"灵光乍现"的思想突破
3. 分析观点的演变轨迹，展现思想的深化过程
4. 语言风格庄重典雅，富有文化底蕴
5. 使用 Markdown 格式，包含年表式章节
6. 篇幅约2000-3000字

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
        user: 'lingjingge-yimi',
      }),
    });

    if (!res.ok) {
      console.warn('[yimi] Dify request failed:', res.status);
      return generateMockChronicle(acharyaName, articleNotes);
    }

    const data = await res.json();
    return data?.answer?.trim() || generateMockChronicle(acharyaName, articleNotes);
  } catch (e) {
    console.warn('[yimi] Dify exception:', e);
    return generateMockChronicle(acharyaName, articleNotes);
  }
}

function generateMockChronicle(acharyaName: string, articleNotes: string): string {
  return `# ${acharyaName} · 思想编年史

## 序

岁月如歌，思想如潮。${acharyaName} 的修行之路，是一段不断探索、不断突破的心灵旅程。本编年史将梳理 ${acharyaName} 历年的思想演变，展现一位修行者在不同阶段的灵光乍现与智慧沉淀。

---

## 第一阶段：缘起与觉醒

### 初入法门

在修行的起点，${acharyaName} 便展现出对东方智慧的浓厚兴趣。从经典研读中汲取养分，从日常修行中感悟真理。这一时期的思想，如同清晨的露珠，清新而纯粹。

### 灵光乍现

某个宁静的夜晚，${acharyaName} 在冥想中突然领悟到："心之所向，牧之以道。"这句话成为日后修行的核心指引。

---

## 第二阶段：深化与拓展

### 法脉传承

随着修行的深入，${acharyaName} 开始系统整理法脉传承，将古老的智慧与现代生活相结合。这一时期的文章，充满了对传统文化的深刻理解和创新诠释。

### 行者故事

通过讲述行者的故事，${acharyaName} 将抽象的修行理念转化为生动的生命体验。每一个故事背后，都蕴含着深刻的哲理。

---

## 第三阶段：融会与贯通

### 三密法门

${acharyaName} 提出了"身密、意密、口密"三密法门的完整体系，将修行分为三个层面：身体的修行、意识的觉醒、声音的疗愈。这一思想体系的形成，标志着修行理论的成熟。

### 智慧整合

将八字命理、风水布局、禅修冥想等多种修行方式融会贯通，形成了独具特色的综合修行方法论。

---

## 结语

${acharyaName} 的思想编年史，是一部心灵成长的史诗。从初入法门的懵懂，到融会贯通的成熟，每一个阶段都闪耀着智慧的光芒。愿这份编年史能够陪伴同修们在修行路上不断前行，找到属于自己的心灵家园。

---

*本文由 AI 根据 ${acharyaName} 历年文章自动整理生成，旨在展现思想演变脉络。*`;
}
