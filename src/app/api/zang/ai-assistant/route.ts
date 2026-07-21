// ============================================================
// /api/zang/ai-assistant —— 藏经 AI 助教（段落参详）
// 调用 Dify「藏经 AI 助教」应用，prompt 负责做现代案例解读
// 支持流式（SSE）与一次性 JSON 两种返回
// 失败时降级为本地经典解读模板
// ============================================================

import { NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const InputSchema = z.object({
  article: z.string().max(200),
  passage: z.string().min(1).max(2000),
  prompt: z.string().min(1).max(4000),
  prior: z.string().max(4000).optional().default(''),
});

const SYSTEM_PROMPT = `你是「藏经 AI 助教」，一位温润理性的东方哲学释经人。
任务：用户会给你一段经典原文（来自《道德经》《金刚经》《心经》《六祖坛经》《易经》等），你需要：

1. 先用 1-2 句白话直译。
2. 再用 1-2 个现代生活场景（职场 / 家庭 / 自我成长）做案例化解读。
3. 末尾留一句可行动的"今日一行"建议。

要求：
- 总字数 150-200 字。
- 语气温和、不说教。
- 现代案例要真实可信，不堆砌鸡汤。
- 涉及宗教处保持中立与尊重。`;

const EXAMPLES: Array<{ passage: string; reply: string }> = [
  {
    passage: '上善若水。水善利万物而不争，处众人之所恶，故几于道。',
    reply:
      '【直译】最高的善像水一样，滋养万物而不与之争，甘愿停留在众人不愿去的低处，因此最接近"道"。\n\n【现代场景】公司里那位不抢功、默默补位的前辈，不争话语权却让每个项目都顺滑运转。\n\n【今日一行】遇到争执时，先让一步。退让不是软弱，是把自己放到能润泽整件事的位置。',
  },
  {
    passage: '应无所住而生其心。',
    reply:
      '【直译】心不应执着于任何一处，而应在不住之中自然生起清净的觉照。\n\n【现代场景】你被同事的负面评价困住一整天——这就是"住"。一旦把评价当作唯一的"我"，情绪就凝固。\n\n【今日一行】当某种念头让你反复咀嚼时，试着对它说"我听见你了"，然后把注意力拉回呼吸。',
  },
];

interface DifyResp {
  ok: boolean;
  status: number;
  contentType: string;
  body: ReadableStream<Uint8Array> | null;
  error?: string;
}

async function callDify(query: string, userId: string): Promise<DifyResp> {
  const apiKey = process.env.DIFY_ZANG_API_KEY;
  const baseUrl = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';

  if (!apiKey) {
    return { ok: false, status: 503, contentType: 'application/json', body: null, error: 'DIFY_ZANG_API_KEY 未配置' };
  }

  try {
    const res = await fetch(`${baseUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: { system_prompt: SYSTEM_PROMPT },
        query,
        user: userId,
        response_mode: 'streaming',
        conversation_id: '',
      }),
    });

    if (!res.ok) {
      return { ok: false, status: res.status, contentType: 'application/json', body: null, error: `Dify ${res.status}` };
    }

    return { ok: true, status: 200, contentType: res.headers.get('content-type') || 'text/event-stream', body: res.body };
  } catch (err) {
    return { ok: false, status: 500, contentType: 'application/json', body: null, error: err instanceof Error ? err.message : 'network error' };
  }
}

/** 寻找最相似的本地模板（按公共子串长度） */
function pickLocalTemplate(passage: string): string {
  const clean = passage.replace(/\s+/g, '');
  let best = EXAMPLES[0];
  let bestScore = 0;
  for (const ex of EXAMPLES) {
    const c = ex.passage.replace(/\s+/g, '');
    let score = 0;
    for (let i = 0; i < Math.min(clean.length, c.length); i++) {
      if (clean[i] === c[i]) score++;
      else break;
    }
    if (score > bestScore) {
      bestScore = score;
      best = ex;
    }
  }
  return best.reply;
}

function sseEncode(obj: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}

export async function POST(request: NextRequest) {
  let input: z.infer<typeof InputSchema>;
  try {
    const json = await request.json();
    const parsed = InputSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(JSON.stringify({ success: false, error: '参数错误' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    input = parsed.data;
  } catch {
    return new Response(JSON.stringify({ success: false, error: '请求体不是合法 JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // 拼装 Dify 入参 query：含原段 + 用户追问 + 上下文
  const query = [
    `【典籍】${input.article}`,
    '',
    '【原文段落】',
    input.passage,
    '',
    '【用户问询】',
    input.prompt,
    input.prior ? `\n\n【上文解读】\n${input.prior}` : '',
  ].join('\n');

  const userId = `zang-${input.article}-${Date.now()}`;
  const dify = await callDify(query, userId);

  // ① Dify 流式成功：直接透传
  if (dify.ok && dify.body) {
    return new Response(dify.body, {
      headers: {
        'Content-Type': dify.contentType,
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  // ② 降级：本地模板包成 SSE
  const reply = pickLocalTemplate(input.passage);
  const stream = new ReadableStream({
    start(controller) {
      // 模拟流式分片
      const chunks = reply.match(/[\s\S]{1,4}/g) || [reply];
      let i = 0;
      let acc = '';
      const tick = () => {
        if (i >= chunks.length) {
          controller.enqueue(
            sseEncode({ event: 'message_end', metadata: { fallback: true, error: dify.error || 'unknown' } }),
          );
          controller.close();
          return;
        }
        acc += chunks[i++];
        controller.enqueue(sseEncode({ event: 'message', answer: chunks[i - 1] }));
        setTimeout(tick, 60);
      };
      tick();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
