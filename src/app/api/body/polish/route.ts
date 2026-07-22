export const dynamic = 'force-dynamic';

// ============================================================
// /api/body/polish —— 身心合一 · 练习后 Dify 报告
// 根据用户练习类型 / 时长 / 完成部位，生成 150-200 字温暖结语。
//
// 协议参考 /api/lifecode/polish：
//   POST {api.dify.ai}/v1/chat-messages
//   body: { inputs, query, response_mode, user }
//   auth:  Bearer <DIFY_BODY_API_KEY>
//
// 流式策略：response_mode=streaming，前端 SSE 实时累加。
// ============================================================

import { NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60;

const InputSchema = z.object({
  type: z.enum(['zhanzhuang', 'zhengqi', 'pingyuan', 'liyuan']),
  category: z.enum(['stillness', 'movement']),
  totalDuration: z.number().int().min(0),
  completedParts: z.number().int().min(0).max(6),
});

const EXERCISE_LABEL: Record<string, string> = {
  zhanzhuang: '混元桩（站桩）',
  zhengqi: '真气运行法（坐禅）',
  pingyuan: '易筋经·平圆',
  liyuan: '易筋经·立圆',
};

const mm = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}分${s ? ` ${s}秒` : ''}`;
};

// —— 流式调 Dify ——
async function callDifyStream(
  inputs: Record<string, unknown>,
  query: string,
  user: string,
): Promise<{ ok: true; body: ReadableStream<Uint8Array>; contentType: string }
       | { ok: false; error: string }> {
  const apiKey = process.env.DIFY_BODY_API_KEY;
  if (!apiKey) return { ok: false, error: 'DIFY_BODY_API_KEY 未配置' };

  const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');

  const res = await fetch(`${baseUrl}/v1/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs,
      query,
      response_mode: 'streaming',
      user,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    return { ok: false, error: `Dify ${res.status}: ${txt.slice(0, 300)}` };
  }
  if (!res.body) return { ok: false, error: 'Dify returned empty body' };

  return { ok: true, body: res.body, contentType: res.headers.get('content-type') || 'text/event-stream' };
}

// —— 本地模板降级 ——
function buildFallback(
  input: z.infer<typeof InputSchema>,
  errorMsg: string,
): string {
  const label = EXERCISE_LABEL[input.type] ?? input.type;
  const dur = mm(input.totalDuration);
  const isStillness = input.category === 'stillness';

  const lines: string[] = [];
  lines.push(`✨ 今日身心调养小结`);
  lines.push(`你刚刚完成了【${label}】，累计 ${dur}。`);
  lines.push('');

  if (isStillness) {
    lines.push('站桩或坐禅时，呼吸归一，杂念渐远；');
    lines.push('身形虽静，内里却有暖意缓缓流转。');
    lines.push('这便是"静中生气"。');
  } else {
    lines.push(`你已连续完成 ${input.completedParts} 个部位的导引 ——`);
    lines.push('关节被打开，经脉被唤醒，气血在动中重新排布。');
    lines.push('这便是"动中养形"。');
  }
  lines.push('');
  lines.push('明日再续，自有不同回响。');
  lines.push('');
  lines.push(`（注：本次未接通 Dify，已使用本地模板。原始错误：${errorMsg}）`);
  return lines.join('\n');
}

function buildFallbackStream(fullText: string, errorMsg: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'message_start' })}\n\n`));
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ event: 'message', answer: fullText })}\n\n`
      ));
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ event: 'message_end', metadata: { fallback: true, error: errorMsg } })}\n\n`
      ));
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      const firstErr = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || '参数错误';
      return new Response(JSON.stringify({ success: false, error: firstErr }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const input = parsed.data;
    const label = EXERCISE_LABEL[input.type] ?? input.type;
    const dur = mm(input.totalDuration);

    const inputs = {
      exercise_type: input.type,
      exercise_label: label,
      category: input.category,
      total_duration: dur,
      total_seconds: input.totalDuration,
      completed_parts: input.completedParts,
      report_type: 'body',
    };

    const query = `你是一位温暖的身心调养师，擅长用东方传统智慧（中医 / 道家 / 禅修）点拨现代人。

用户刚刚完成了一次身心练习：
- 练习类型：${label}
- 分类：${input.category === 'stillness' ? '静功' : '动功'}
- 累计时长：${dur}
${input.category === 'movement' ? `- 完成部位：${input.completedParts} / 6 个` : ''}

请写一段 150-200 字的温暖结语，要求：
1. 第一句点题：肯定他/她今天愿意把时间留给自己；
2. 中间结合「${label}」的特点，给出 1-2 句可感知的身体感受描述（静功可写"气沉丹田""呼吸绵长"；动功可写"关节打开""气血流通"）；
3. 结尾给出 1 条明日可立即执行的"调养小行动"（如：早起站桩 3 分钟、午间拉伸肩颈、睡前数息 20 次）。
4. 语气如师如友，不玄虚、不恐吓、不打鸡血；不要提"算命""运势""命运"。`;

    // —— 尝试流式 ——
    const stream = await callDifyStream(
      inputs,
      query,
      `body-${input.type}-${Date.now()}`,
    );

    if (stream.ok) {
      return new Response(stream.body, {
        status: 200,
        headers: {
          'Content-Type': stream.contentType,
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
          'X-Body-Source': 'dify-streaming',
        },
      });
    }

    // —— 流式失败：降级到伪 SSE ——
    console.warn('[api/body/polish] Dify 流式失败，回退到本地模板:', stream.error);
    const fb = buildFallback(input, stream.error);
    return new Response(buildFallbackStream(fb, stream.error), {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Body-Source': 'local-template',
      },
    });
  } catch (err) {
    console.error('[api/body/polish] 错误:', err);
    const msg = err instanceof Error ? err.message : '服务器内部错误';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
