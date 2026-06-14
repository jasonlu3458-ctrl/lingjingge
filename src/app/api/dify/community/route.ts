import { NextRequest, NextResponse } from 'next/server';

/**
 * 社区助手 API
 *
 * 支持的功能：
 * 1. classify: 帖子分类
 * 2. knowledge: 知识库问答
 * 3. essence: 精华识别
 * 4. topic: 话题生成
 * 5. auto-reply: AI 自动回帖（用户发新帖后由同修助手鼓励回复）
 *
 * 修复：
 *  - Dify 请求体字段 `stream: false` → `response_mode: 'blocking'`（Dify 协议字段名）
 *  - auto-reply 的 content 是对象 {title,body,tag}，构造 prompt 时用安全序列化
 *  - mock 兜底在 Dify 报错时仍可工作
 */

type AutoReplyContent = {
  title?: string;
  body?: string;
  tag?: string;
  authorName?: string;
};

// Edge runtime —— 出口网络与 Node.js Serverless 不同，可绕过 DIFY Cloud 对共享 IP 的限流
export const runtime = 'edge';

/** 25s 硬超时调用 Dify（blocking 模式） */
async function callDify(apiKey: string, prompt: string, user: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  let res: Response;
  try {
    res = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: prompt,
        user: user || 'lingjingge-user',
        response_mode: 'blocking',
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new Error(`Dify network error: ${err instanceof Error ? err.message : String(err)}`);
  }
  clearTimeout(timer);
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Dify ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.answer || '';
}

export async function POST(req: Request) {
  try {
    const { type, content, user } = await req.json();

    const apiKey = process.env.DIFY_COMMUNITY_API_KEY || process.env.DIFY_API_KEY;

    // 根据 type 构造不同的提示词
    let prompt = '';
    switch (type) {
      case 'classify':
        prompt = `请判断以下帖子类别（问卦/心得/求助/分享），只返回类别名：${content}`;
        break;
      case 'knowledge':
        prompt = `请从知识库中检索并回答：${content}`;
        break;
      case 'essence':
        prompt = `请判断以下内容是否为精华（是/否 + 简短理由）：${content}`;
        break;
      case 'topic':
        prompt = `今天是 ${content}，请生成一个今日参究话题。`;
        break;
      case 'auto-reply': {
        // content 可能是对象也可能是字符串，做兼容
        const c: AutoReplyContent = typeof content === 'string'
          ? safeJsonParse<AutoReplyContent>(content) || { body: content }
          : (content || {}) as AutoReplyContent;
        prompt = `你是一位温和、富有智慧的中文同修助手。请用 80-150 字对以下帖子回复一段鼓励性的内容。
要求：
1. 先肯定作者的分享（不要空洞赞美）
2. 围绕主题做一点延展或提问
3. 收尾以祝福或邀请交流的语气
4. 不使用"加油""棒棒哒"等过于轻浮的网络用语
5. 不提及你是 AI / 机器人

帖子标题：${c.title || ''}
帖子内容：${c.body || ''}
作者分类：${c.tag || '心得'}`;
        break;
      }
      default:
        return NextResponse.json({ error: '未知的操作类型' }, { status: 400 });
    }

    // 如果没有 API Key，返回 Mock 数据
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        type,
        result: getMockResponse(type, content),
        source: 'mock-no-key',
      });
    }

    // 调用 Dify（带 30s 超时 + 失败降级到 mock）
    try {
      const answer = await callDify(apiKey, prompt, user);
      return NextResponse.json({ success: true, type, result: answer, source: 'dify' });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(`[dify/community] ${type} 失败 (${reason})，降级到 mock`);
      return NextResponse.json({
        success: true,
        type,
        result: getMockResponse(type, content),
        source: 'mock-fallback',
        difyError: reason.slice(0, 200),
      });
    }

  } catch (error) {
    console.error('Community API 错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

function safeJsonParse<T>(s: string): T | null {
  try { return JSON.parse(s) as T; } catch { return null; }
}

/**
 * Mock 响应数据（当没有 API Key 时使用）
 * auto-reply 的 content 现在直接传对象，不再 JSON.parse
 */
function getMockResponse(type: string, content: any): string {
  const asString = (typeof content === 'string') ? content : '';
  switch (type) {
    case 'classify':
      if (asString.includes('运气') || asString.includes('卦') || asString.includes('占卜')) return '问卦';
      if (asString.includes('孩子') || asString.includes('教育') || asString.includes('亲子') ||
          asString.includes('禅')  || asString.includes('打坐') || asString.includes('冥想') ||
          asString.includes('身体') || asString.includes('健康') || asString.includes('养生')) return '心得';
      if (asString.includes('情绪') || asString.includes('焦虑') || asString.includes('压力')) return '求助';
      return '心得';

    case 'knowledge': {
      const knowledgeBase: Record<string, string> = {
        '禅宗': '禅宗是佛教的一个重要流派，起源于印度，传至中国后发扬光大。其核心思想是"直指人心，见性成佛"，强调通过禅定修行，觉悟自性。禅宗不立文字，以心传心，主张在日常生活中修行。',
        '正念': '正念源于佛教禅修，是一种专注于当下、不评判的觉察方式。通过有意识地关注当下的呼吸、身体感受、情绪和想法，培养专注力和觉知力。',
        '易经': '《易经》是中国古代经典之一，被誉为"群经之首"。它以阴阳变化为理论基础，通过八卦和六十四卦来阐述天地人事的变化规律。',
        '冥想': '冥想是一种心灵修炼的方法，通过静坐和专注，达到身心放松和意识提升的效果。常见的方式包括呼吸冥想、正念冥想、慈心禅等。',
      };
      for (const [key, value] of Object.entries(knowledgeBase)) {
        if (asString.includes(key)) return value;
      }
      return `关于"${asString}"的知识，正在从知识库中检索相关信息...`;
    }

    case 'essence': {
      const hasDepth     = asString.length > 200;
      const hasQuestion  = asString.includes('？') || asString.includes('?');
      const hasReflection = asString.includes('感悟') || asString.includes('体会');
      const hasQuote     = asString.includes('"')  || asString.includes('「');
      const score = [hasDepth, hasQuestion, hasReflection, hasQuote].filter(Boolean).length;
      if (score >= 3) return '是精华：内容深入，有独到见解，结合了实践体会和经典引用。';
      if (score >= 2) return '是精华：内容有一定的深度和思考。';
      return '暂不列为精华：内容较为简单，缺乏深度分析。';
    }

    case 'topic': {
      const topics = [
        '什么是真正的放下？',
        '如何在生活中修行？',
        '如何面对焦虑和压力？',
        '什么是觉醒的征兆？',
        '如何培养正念的习惯？',
        '怎样看待命运与自由意志？',
        '如何在喧嚣中保持内心平静？',
        '什么是禅宗的核心智慧？',
      ];
      const seed = asString.split('-').reduce((acc, num) => acc + parseInt(num || '0', 10), 0);
      return `今日参究：${topics[seed % topics.length]}`;
    }

    case 'auto-reply': {
      // content 可能是对象或字符串
      const c: AutoReplyContent = typeof content === 'string'
        ? (safeJsonParse<AutoReplyContent>(content) || { body: content })
        : (content || {}) as AutoReplyContent;
      const tag   = c.tag   || '心得';
      const title = c.title || '';
      const body  = c.body  || '';
      const isShort = body.length < 80;

      const intros: Record<string, string> = {
        '心得':   '看到你这一路的内心沉淀，很受触动。',
        '分享':   '感谢你把这样一份真实的体验带到了同修社区。',
        '求助':   '你愿意把困惑说出来，本身就是一种勇气。',
        '问卦':   '占问出于求真，希望下面的视角能为你多打开一扇窗。',
        'default': '感谢你在同修社区留下了这份真诚的分享。',
      };
      const intro = intros[tag] || intros['default'];

      const tails = [
        '愿你在接下来的一段时间里继续觉察，变化往往发生在安静处。',
        '如果方便，欢迎在评论里再多说一些你的具体做法，同修们会更有共鸣。',
        '愿你今晚安住于此刻，这个问题不需要立刻有答案。',
        '修行路上不孤单，期待你下一次继续分享。',
      ];
      const tail = tails[Math.abs(title.length + body.length) % tails.length];

      if (isShort) {
        return `${intro}题目「${title}」很值得展开，期待你后续在评论中再多说一些具体情境——一次细小的觉察，往往就是修行的入口。${tail}`;
      }
      return `${intro}你提到的细节让人很有共鸣——尤其是「${title.slice(0, 12)}」这一段，留白处见真心。${tail}`;
    }

    default:
      return '未知类型';
  }
}

// GET 方法用于测试
export async function GET() {
  return NextResponse.json({
    message: 'Community Assistant API',
    supported_types: ['classify', 'knowledge', 'essence', 'topic', 'auto-reply'],
    example: {
      classify: 'POST with { type: "classify", content: "我最近运势不好" }',
      knowledge: 'POST with { type: "knowledge", content: "什么是禅宗？" }',
      essence: 'POST with { type: "essence", content: "一篇深度帖子内容..." }',
      topic: 'POST with { type: "topic", content: "2026-06-07" }',
      'auto-reply': 'POST with { type: "auto-reply", content: { title: "...", body: "...", tag: "心得" } }'
    }
  });
}
