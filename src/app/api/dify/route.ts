import { NextRequest, NextResponse } from 'next/server';

// ============================================
// /api/dify  ——  灵境阁统一的 Dify 聊天代理
// ============================================
// 修复点：
//  1) 不再把 ReadableStream 存进缓存（流是一次性消耗的），
//     改为只缓存已序列化的最终文本，再重新包装为 SSE。
//  2) 新增 DIFY_API_KEY 统一兜底：未配置专属 key 时使用同一个全局 key。
//  3) Mock 响应改为按用户 query 生成（至少要 ack 一下输入），
//     不再对所有输入返回同一段固定文本。
//  4) Dify 报错时降级到 mock，并打 warn，不再让用户看到空白。
//  5) 修复 conversations_id 透传：前后端都用同一个 conversation_id。
// ============================================

// —— 内存缓存：只缓存「已序列化」的文本 ——
type CachedReply = { text: string; timestamp: number };
const cache = new Map<string, CachedReply>();
const CACHE_DURATION = 5 * 60 * 1000;

const isCacheValid = (ts: number) => Date.now() - ts < CACHE_DURATION;
const generateCacheKey = (type: string, query: string) => `${type}:${query.slice(0, 100)}`;

// —— API Key 映射表 ——
const TYPED_KEYS: Record<string, string | undefined> = {
  // 问道 (wen/)
  'ai-zen-master': process.env.DIFY_AI_ZEN_MASTER_API_KEY,
  'mind':          process.env.DIFY_MIND_API_KEY,
  'parenting':     process.env.DIFY_PARENTING_API_KEY,
  'yili':          process.env.DIFY_YILI_API_KEY,
  'gongan':        process.env.DIFY_GONGAN_API_KEY,
  'awakening':     process.env.DIFY_AWAKENING_API_KEY,
  'meditation':    process.env.DIFY_MEDITATION_API_KEY,
  'healing':       process.env.DIFY_HEALING_API_KEY,
  // 观心 (guan/)
  'health':        process.env.DIFY_HEALTH_API_KEY,
  'mingli':        process.env.DIFY_MINGLI_API_KEY,
  'name':          process.env.DIFY_NAME_API_KEY,
  'tili':          process.env.DIFY_TILI_API_KEY,
  'pastlife':      process.env.DIFY_PASTLIFE_API_KEY,
  // 藏经 (zang/)
  'library_classics':  process.env.DIFY_LIBRARY_CLASSICS_API_KEY,
  'library_treasure':  process.env.DIFY_LIBRARY_TREASURE_API_KEY,
  // 同修 (tong/)
  'community_essence':  process.env.DIFY_COMMUNITY_ESSENCE_API_KEY,
  'community_topics':   process.env.DIFY_COMMUNITY_TOPICS_API_KEY,
};

const GLOBAL_FALLBACK_KEY = process.env.DIFY_API_KEY;

/** 取一个 type 对应的可用 key：优先专属 key，回落到全局 key */
function resolveApiKey(type: string): string | undefined {
  return TYPED_KEYS[type] || GLOBAL_FALLBACK_KEY || undefined;
}

// —— Mock 文本（按 type + query 动态生成，至少回应用户输入）——
//   关键：mock 路径必须对前端明确告知「这是占位回复，不是 AI 真在运行」
//   否则生产环境一旦 Dify 密钥丢失，用户看到的固定话术会被误认为 AI 正常运行。
function buildMockText(type: string, query: string): { text: string; isMock: true; reason: string } {
  const q = (query || '').trim();
  const echo = q ? `关于「${q.slice(0, 24)}${q.length > 24 ? '…' : ''}」，` : '';
  const templates: Record<string, string> = {
    'ai-zen-master': `${echo}此问已入心。在禅宗，机锋往往不在答案里，而在提问的那一刻——你愿意再停一停吗？`,
    'mind':          `${echo}我感受到你正在尝试表达自己。这本身就是一种勇气。试着把注意力带回呼吸三次，再告诉我：此刻最强烈的感受是什么？`,
    'parenting':     `${echo}孩子的每一个行为背后都有未被看见的需求。先放下"应该怎样"，让我们一起回到"孩子真正在说什么"。`,
    'yili':          `${echo}易经讲"时、位、应、承"。起卦前先静心，把你的问题再说一遍，让它落在"此一刻"。`,
    'gongan':        `${echo}公案不是用来想明白的，是用来参破的。把你第一念浮起的答案写下，我们一起看。`,
    'awakening':     `${echo}觉醒不在远方，就在这一次「我看见了什么」的觉察里。`,
    'meditation':    `${echo}回到呼吸。一吸，一呼，让心有家可归。`,
    'healing':       `${echo}身体从未说谎。它在用紧绷、疼痛、疲惫提醒你：慢一点，回到自己。`,
    'health':        `${echo}体质是动态的「地图」，不是标签。说说最近的睡眠、情绪、饮食，让地图更清晰。`,
    'mingli':        `${echo}命理不是为了算命，而是为了"知己"。把出生年月日时告诉我，我们一起看看。`,
    'name':          `${echo}好名字是有能量的。说说姓氏、生辰、期望的气质，让我为你推一推。`,
    'tili':          `${echo}炼体先炼气，炼气先炼心。先问：你愿意给自己一个怎样的"日常"？`,
    'pastlife':      `${echo}前世不是宿命，是习气。今天遇到的人和事，常常是前世剧本的回响。`,
    'library_classics':  `${echo}经典像一面镜子，你读的当下，它照见的正是此刻的你。`,
    'library_treasure':  `${echo}秘藏是行者的脚注。读懂它的前提，是先走一段路。`,
  };
  const fallbackText = templates[type]
    || `${echo}这是一个占位回复（未配置 Dify API Key）。请联系管理员在 Vercel Dashboard → Settings → Environment Variables 中设置 ${type.toUpperCase()}_API_KEY 或全局 DIFY_API_KEY。`;
  return { text: fallbackText, isMock: true, reason: 'dify_not_configured' };
}

// —— 把一段文本包成与 Dify 协议兼容的 SSE 流（可附带 metadata）——
function wrapAsSseStream(
  fullText: string,
  conversationId: string,
  meta: Record<string, any> = {},
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      const messageId = `msg_${Date.now()}`;
      // 起始事件
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'message_start', message_id: messageId, metadata: meta })}\n\n`));
      // 一次性把文本作为 message 事件发出去（前端 useAIChat 兼容 event=message / agent_message）
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'message', answer: fullText, conversation_id: conversationId, metadata: meta })}\n\n`));
      // 结束
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'message_end', message_id: messageId, conversation_id: conversationId, metadata: meta })}\n\n`));
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });
}

// —— 真正的 Dify 代理（透传流） ——
async function proxyToDify(
  apiKey: string,
  type: string,
  query: string,
  conversationId: string | undefined,
  inputs: Record<string, any> | undefined,
  user: string,
): Promise<Response> {
  const body: Record<string, any> = {
    inputs: { ...(inputs || {}) },
    query,
    response_mode: 'streaming', // ← 关键：Dify 协议字段名是 response_mode
    user: user || 'lingjingge-user',
  };
  if (conversationId) body.conversation_id = conversationId;

  const difyRes = await fetch('https://api.dify.ai/v1/chat-messages', {
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
  if (!difyRes.body) {
    throw new Error('Dify returned empty body');
  }
  return new Response(difyRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: '请求体不是有效的 JSON' }, { status: 400 });
    }
    const { type, query, conversation_id, inputs, user } = body;

    if (!type) return NextResponse.json({ error: '缺少类型标识 type' }, { status: 400 });
    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: '缺少查询内容 query' }, { status: 400 });
    }

    const apiKey = resolveApiKey(type);
    const convId = (typeof conversation_id === 'string' && conversation_id.trim()) ? conversation_id.trim() : undefined;
    const isNewConversation = !convId;

    // —— 1) 缓存：只对"无 conversation_id"（新会话）做 5 分钟文本缓存 ——
    if (isNewConversation) {
      const cacheKey = generateCacheKey(type, query);
      const hit = cache.get(cacheKey);
      if (hit && isCacheValid(hit.timestamp)) {
        const stream = wrapAsSseStream(hit.text, `cached_${Date.now()}`, { source: 'cache' });
        return new Response(stream, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        });
      }
    }

    // —— 2) 有 Dify Key：走真实代理 ——
    if (apiKey) {
      try {
        return await proxyToDify(apiKey, type, query, convId, inputs, user);
      } catch (err) {
        console.warn(`[dify] ${type} 代理失败，降级到 mock:`, err);
        // 降级不抛错，继续走 mock
      }
    } else {
      console.warn(`[dify] ${type} 未配置 DIFY_*_API_KEY 且无全局 DIFY_API_KEY，使用 mock 响应`);
    }

    // —— 3) Mock 路径：生成文本 → 缓存 → 包成 SSE（明确标注是占位回复）——
    const mockPayload = buildMockText(type, query);
    if (isNewConversation) {
      cache.set(generateCacheKey(type, query), { text: mockPayload.text, timestamp: Date.now() });
    }
    const stream = wrapAsSseStream(mockPayload.text, `mock_${Date.now()}`, {
      source: 'mock',
      isMock: mockPayload.isMock,
      mockReason: mockPayload.reason,
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    console.error('[dify] 代理错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 调试用：列出已配置的 key + 真连通性测试
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (url.searchParams.get('ping') === '1') {
    // 真连通性测试：用每个非空 key 发最小请求到 DIFY
    const tests: Array<{ type: string; status: number | string; body: string; keyPrefix: string }> = [];
    for (const [type, key] of Object.entries(TYPED_KEYS)) {
      if (!key) {
        tests.push({ type, status: 'no_key', body: '', keyPrefix: '' });
        continue;
      }
      try {
        const r = await fetch('https://api.dify.ai/v1/chat-messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: {},
            query: 'ping',
            response_mode: 'blocking',
            user: 'connectivity-test',
          }),
          signal: AbortSignal.timeout(15000),
        });
        const text = await r.text();
        tests.push({
          type,
          status: r.status,
          body: text.slice(0, 300),
          keyPrefix: key.slice(0, 6) + '...' + key.slice(-3),
        });
      } catch (e) {
        tests.push({
          type,
          status: 'fetch_error',
          body: (e instanceof Error ? e.message : String(e)).slice(0, 200),
          keyPrefix: key ? key.slice(0, 6) + '...' + key.slice(-3) : '',
        });
      }
    }
    return NextResponse.json({ ping: true, tests });
  }
  return NextResponse.json({
    typedKeys: Object.fromEntries(Object.entries(TYPED_KEYS).map(([k, v]) => [k, Boolean(v)])),
    hasGlobalFallback: Boolean(GLOBAL_FALLBACK_KEY),
  });
}
