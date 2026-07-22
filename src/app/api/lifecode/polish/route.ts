export const dynamic = 'force-dynamic';

// ============================================================
// /api/lifecode/polish —— AI 生命密码 · Dify 润色接口
// 调真实 Dify（key 来自 DIFY_LIFECODE_API_KEY，Dify 端把
// 由 /api/lifecode 计算好的核心人格 / 季节 / 流年润色为
// 一份通俗、温暖、可执行的"天赋觉醒指南"。
//
// 协议参考 /api/wealth/polish：
//   POST {api.dify.ai}/v1/chat-messages
//   body: { inputs, query, response_mode, user, conversation_id? }
//   auth:  Bearer <DIFY_LIFECODE_API_KEY>
//
// 流式策略：
//   · 默认走 SSE（response_mode: streaming），Dify 一边生成一边
//     推到浏览器，前端 ReadableStream 实时累加。
//   · Dify 报错 / 无 key / 走本地模板时，降级为 application/json
//     返回（前端按 content-type 自动识别）。
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkLifeCodeRules } from '@/lib/lifecode-rules';

export const runtime = 'nodejs';
export const maxDuration = 60;

const InputSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(['female', 'male']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthHour: z.number().int().min(0).max(23).default(12),
  calendarType: z.enum(['solar', 'lunar']),
  user: z.string().optional(),
  conversation_id: z.string().optional(),
});

function reportToInputs(report: ReturnType<typeof checkLifeCodeRules>) {
  const reportContext = [
    `【用户基本信息】姓名：${report.input.name}，性别：${report.input.gender === 'female' ? '女' : '男'}，出生：${report.bazi.solarDate}`,
    `【八字】年柱 ${report.bazi.yearGanzhi} 月柱 ${report.bazi.monthGanzhi} 日柱 ${report.bazi.dayGanzhi}（日干 ${report.bazi.dayStem}，属${report.bazi.dayElement}），生肖：${report.bazi.yearZodiac}`,
    `【核心人格】${report.coreCode.label} · ${report.coreCode.personality}。最鲜明特质：${report.coreCode.keyTrait}。最佳工作环境：${report.coreCode.bestEnvironment}。最佳伴侣：${report.coreCode.bestPartner}`,
    `【出生季节】${report.seasonType.label}，能量：${report.seasonType.energy}`,
    `【本年流年】${report.currentYearAdvice.year}年（${report.currentYearAdvice.yearGanzhi}），与日干属${report.currentYearAdvice.relation}，本年重点：${report.currentYearAdvice.focus}（${report.currentYearAdvice.area}）`,
    `【灵魂低语】${report.free.whisper.content}`,
    `【人格底色】${report.free.origin.content}`,
    `【性格解码】${report.free.personality.content}`,
    `【关系匹配】${report.free.relationship.content}`,
    `【天赋潜力】${report.free.potential.content}`,
    `【付费·成长路线】${report.paid.growth.content}`,
    `【付费·灵魂伴侣】${report.paid.soulmate.content}`,
    `【付费·事业方向】${report.paid.careerPath.content}`,
    `【付费·人生季节】${report.paid.lifeSeason.content}`,
    `【付费·3 步觉醒】${report.paid.threeSteps.content}`,
    `【综合评分】${report.score} / 100`,
  ].join('\n');

  return {
    name: report.input.name,
    user_name: report.input.name,
    gender: report.input.gender,
    solar_date: report.bazi.solarDate,
    lunar_date: report.bazi.lunarDate,
    bazi_year: report.bazi.yearGanzhi,
    bazi_month: report.bazi.monthGanzhi,
    bazi_day: report.bazi.dayGanzhi,
    year_zodiac: report.bazi.yearZodiac,
    day_stem: report.bazi.dayStem,
    day_element: report.bazi.dayElement,
    year_branch: report.bazi.yearBranch,
    core_code: report.coreCode.label,
    core_personality: `${report.coreCode.label} · ${report.coreCode.personality}`,
    personality: report.coreCode.personality,
    key_trait: report.coreCode.keyTrait,
    best_environment: report.coreCode.bestEnvironment,
    best_partner: report.coreCode.bestPartner,
    season_type: report.seasonType.type,
    season_label: report.seasonType.label,
    season_energy: report.seasonType.energy,
    current_year: report.currentYearAdvice.year,
    current_year_ganzhi: report.currentYearAdvice.yearGanzhi,
    current_year_advice: JSON.stringify(report.currentYearAdvice),
    year_relation: report.currentYearAdvice.relation,
    year_focus: report.currentYearAdvice.focus,
    year_area: report.currentYearAdvice.area,
    score: report.score,
    report_type: 'lifecode',
    report_context: reportContext,
    // Dify 端常用别名
    profile_data: reportContext,
    context: reportContext,
    user_profile: reportContext,
    bazi_data: reportContext,
  };
}

// —— 流式：直接透传 Dify 的 SSE body ——
async function callDifyStream(
  inputs: Record<string, unknown>,
  query: string,
  user: string,
  conversationId: string | undefined,
): Promise<{ ok: true; body: ReadableStream<Uint8Array>; contentType: string }
       | { ok: false; error: string }> {
  const apiKey = process.env.DIFY_LIFECODE_API_KEY;
  if (!apiKey) return { ok: false, error: 'DIFY_LIFECODE_API_KEY 未配置' };

  const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');

  const body: Record<string, unknown> = {
    inputs,
    query,
    response_mode: 'streaming', // ← 流式：Dify 一边生成一边推
    user: user || 'lingjingge-lifecode-user',
  };
  if (conversationId) body.conversation_id = conversationId;

  const res = await fetch(`${baseUrl}/v1/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    return { ok: false, error: `Dify ${res.status}: ${txt.slice(0, 300)}` };
  }
  if (!res.body) return { ok: false, error: 'Dify returned empty body' };

  return { ok: true, body: res.body, contentType: res.headers.get('content-type') || 'text/event-stream' };
}

// —— 本地模板（流式降级方案：包成伪 SSE + 一次性把全文推给前端）——
function buildFallbackStream(fullText: string, errorMsg: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      // 起始事件
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'message_start' })}\n\n`));
      // 一次推完（前端 ReadableStream 也会按 chunk 渲染，体感仍像是"生成中"）
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ event: 'message', answer: fullText })}\n\n`
      ));
      // 错误标记
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ event: 'message_end', metadata: { fallback: true, error: errorMsg } })}\n\n`
      ));
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });
}

// —— 本地模板（JSON 形式的降级文本）——
function buildFallbackText(report: ReturnType<typeof checkLifeCodeRules>, errorMsg: string): string {
  return [
    `✨ ${report.input.name} 的 AI 生命密码 · 天赋觉醒`,
    `综合评分：${report.score} / 100（${report.coreCode.label}型人格）`,
    ``,
    `【核心人格】${report.free.origin.content}`,
    ``,
    `【性格解码】${report.free.personality.content}`,
    ``,
    `【关系匹配】${report.free.relationship.content}`,
    ``,
    `【天赋潜力】${report.free.potential.content}`,
    ``,
    `【灵魂低语】${report.free.whisper.content}`,
    ``,
    `【本年节奏】${report.currentYearAdvice.suggestion}`,
    ``,
    `【付费·成长路线】${report.paid.growth.content}`,
    ``,
    `【付费·灵魂伴侣】${report.paid.soulmate.content}`,
    ``,
    `【付费·事业方向】${report.paid.careerPath.content}`,
    ``,
    `【付费·人生季节】${report.paid.lifeSeason.content}`,
    ``,
    `【付费·3 步觉醒】${report.paid.threeSteps.content}`,
    ``,
    `（注：本次未接通 Dify，已使用本地模板。原始错误：${errorMsg}）`,
  ].join('\n');
}

async function callDify(inputs: Record<string, unknown>, query: string, user: string, conversationId?: string): Promise<string> {
  const apiKey = process.env.DIFY_LIFECODE_API_KEY;
  if (!apiKey) throw new Error('DIFY_LIFECODE_API_KEY 未配置');

  const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');

  const body: Record<string, unknown> = {
    inputs,
    query,
    response_mode: 'blocking',
    user: user || 'lingjingge-lifecode-user',
  };
  if (conversationId) body.conversation_id = conversationId;

  const res = await fetch(`${baseUrl}/v1/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Dify ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const answer =
    data?.answer ||
    data?.data?.outputs?.answer ||
    data?.data?.outputs?.text ||
    data?.outputs?.answer ||
    data?.outputs?.text ||
    '';
  if (!answer) throw new Error('Dify 响应中未找到 answer 字段');
  return String(answer);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      const firstErr = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || '参数错误';
      return NextResponse.json({ success: false, error: firstErr }, { status: 400 });
    }

    const input = parsed.data;
    const { user, conversation_id } = input;

    const report = checkLifeCodeRules(input);
    const inputs = reportToInputs(report);

    const query = `你是一位资深的个人成长导师与东方命理顾问（不是算命先生），擅长把古老的八字智慧转化为现代人能立刻用上的自我认知工具。用户的核心人格是「${report.coreCode.label} · ${report.coreCode.personality}」，日柱 ${report.bazi.dayGanzhi}（属${report.bazi.dayElement}），出生季节：${report.seasonType.label}。本年（${report.currentYearAdvice.yearGanzhi}）与日干属${report.currentYearAdvice.relation}，重点发力方向：${report.currentYearAdvice.focus}（${report.currentYearAdvice.area}）。

请基于以上信息，结合【综合评分 ${report.score} / 100】，写一份 500-700 字的《天赋觉醒指南》。

要求：
1. 严禁只说"你命好" / "今年运势佳"这种空话，必须给出**具体、可执行**的自我认知建议；
2. 报告标题：《AI 生命密码 · ${report.input.name}的天赋觉醒》；
3. 分四段呈现：
   ① 一句话点题（把【${report.coreCode.label} · ${report.coreCode.personality}】的日干人格标签转化为一句富有哲理的话 —— 说明这个人的性格底色是什么，最适合的工作环境是什么，最适合的人生伴侣类型是什么）；
   ② 本我地图（3 条具体日常建议，告诉用户"如何把 ${report.coreCode.label} 的天赋在日常里用出来"）；
   ③ 季节 × 流年（${report.seasonType.label} 的能量 + ${report.currentYearAdvice.year} 年 ${report.currentYearAdvice.yearGanzhi} 的 ${report.currentYearAdvice.relation} 关系 = 本年节奏）；
   ④ 结尾给出 **1 条可立刻执行的"觉醒小行动"**（如：给某个重要的人发一段话、写一段话给自己、删除某个 app 等）。
4. 必须出现：${report.input.name}、${report.coreCode.label}、${report.bazi.dayElement}、${report.currentYearAdvice.year} 年、${report.seasonType.type}季。
5. 强调"个人觉醒"而非"算命" —— 你是在帮人看见自己，不是预测未来。
6. 语言温暖、有可操作性，避免绝对化判断。`;

    try {
      // —— 流式：直接转发 Dify 的 SSE body 给前端 ——
      const stream = await callDifyStream(
        inputs,
        query,
        user || `lc-${input.name}-${input.birthDate}`,
        conversation_id
      );

      if (stream.ok) {
        return new Response(stream.body, {
          status: 200,
          headers: {
            'Content-Type': stream.contentType,
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // 禁用 nginx 缓冲（如部署到生产）
            'X-Lifecode-Source': 'dify-streaming',
          },
        });
      }

      // —— 流式失败：降级到 JSON 包（前端识别为 local-template）——
      console.warn('[api/lifecode/polish] Dify 流式失败，回退到 JSON:', stream.error);
      const fb = buildFallbackText(report, stream.error);
      return NextResponse.json(
        { success: true, source: 'local-template', polished: fb, error: stream.error },
        { status: 200 }
      );
    } catch (err) {
      console.warn('[api/lifecode/polish] Dify 失败，回退到本地模板:', err);
      const fallback = buildFallbackText(report, err instanceof Error ? err.message : '未知错误');
      return NextResponse.json(
        { success: true, source: 'local-template', polished: fallback, error: err instanceof Error ? err.message : '未知' },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error('[api/lifecode/polish] 错误:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}
