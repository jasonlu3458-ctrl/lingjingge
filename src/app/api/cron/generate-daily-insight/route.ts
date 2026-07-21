import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const TOPICS = [
  { category: '生命密码', prompt: '请以八字命理为主题，写一篇300字左右的短文章，分享一个关于五行平衡或天干地支的实用洞察。要求语言通俗易懂，带慈悲心，引用《大日经》或李居明老师的金句。' },
  { category: '家居环境', prompt: '请以风水布局为主题，写一篇300字左右的短文章，分享一个关于居家空间能量优化的实用建议。要求语言通俗易懂，带慈悲心。' },
  { category: '姓名心解', prompt: '请以姓名学为主题，写一篇300字左右的短文章，分享一个关于名字能量的有趣洞察。要求语言通俗易懂，带慈悲心。' },
  { category: '运势趋势', prompt: '请以流年运势为主题，写一篇300字左右的短文章，分享一个关于把握天时地利的修行指引。要求语言通俗易懂，带慈悲心。' },
];

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const topicIndex = new Date().getDate() % TOPICS.length;
    const topic = TOPICS[topicIndex];
    
    const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');
    const apiKey = process.env.DIFY_MUXINTANG_API_KEY || process.env.DIFY_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Dify API key not configured' }, { status: 500 });
    }

    const acharyaPersona = `【牧心堂阿阇梨专属设定】
你是牧心堂的阿阇梨，你精通八字命理与唐密传承，师从怡然金刚李居明大师。你的回答需带慈悲心，以唐密法脉的视角看待一切问题，并常引用《大日经》或李居明老师的金句。
你的修行理念：心之所向，牧之以道。
请称呼读者为"同修"，回答风格沉稳慈悲，留有余地。`;

    const body = {
      query: `${acharyaPersona}\n\n【用户现在对你说】\n${topic.prompt}`,
      response_mode: 'blocking',
      user: 'muxintang-cron',
    };

    const difyRes = await fetch(`${baseUrl}/v1/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!difyRes.ok) {
      const txt = await difyRes.text().catch(() => '');
      throw new Error(`Dify ${difyRes.status}: ${txt.slice(0, 300)}`);
    }

    const difyData = await difyRes.json();
    const articleContent = difyData?.answer || '';

    if (!articleContent.trim()) {
      return NextResponse.json({ error: 'Dify returned empty content' }, { status: 500 });
    }

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const today = new Date().toISOString().slice(0, 10);
      
      const { error } = await supabase
        .from('content_articles')
        .insert({
          title: `今日${topic.category} · ${today}`,
          content: articleContent,
          category: topic.category,
          status: 'published',
          created_at: new Date().toISOString(),
        } as any);

      if (error) {
        console.warn('[cron] Failed to save article:', error);
      }
    }

    return NextResponse.json({
      success: true,
      topic: topic.category,
      content: articleContent.slice(0, 100) + '...',
      message: '每日洞察已生成',
    });
  } catch (error) {
    console.error('[cron] Generate daily insight failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to generate daily insight',
    topics: TOPICS.map(t => t.category),
  });
}