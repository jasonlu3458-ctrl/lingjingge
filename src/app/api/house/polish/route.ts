// ============================================================
// /api/house/polish —— 家居环境 · Dify 润色接口（SSE 流式）
// 协议参考 /api/lifecode/polish：
//   走 Dify streaming → 直接透传 body 给前端
//   失败时降级到 JSON 包（前端按 content-type 识别）
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkHouseRules } from '@/lib/house-rules';

export const runtime = 'nodejs';
export const maxDuration = 60;

const InputSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(['male', 'female']),
  birthYear: z.number().int().min(1900).max(2100),
  doorDirection: z.enum([
    'east', 'southeast', 'south', 'southwest',
    'west', 'northwest', 'north', 'northeast',
  ]),
  area: z.number().min(10).max(2000),
  familyStructure: z.enum(['single', 'couple', 'family-kids', 'three-gen', 'elderly']),
  user: z.string().optional(),
  conversation_id: z.string().optional(),
});

function reportToInputs(report: ReturnType<typeof checkHouseRules>) {
  const reportContext = [
    `【用户基本信息】姓名：${report.input.name}，性别：${report.input.gender === 'male' ? '男' : '女'}，出生年：${report.input.birthYear}，房屋面积：${report.input.area}㎡，家庭结构：${report.input.familyStructure}`,
    `【命卦】${report.guaCn}卦（属${report.guaElement}），属于${report.guaGroup === 'east' ? '东四命' : '西四命'}。推算方式：${report.guaMethod}`,
    `【大门方位】${report.doorCn}方（${report.doorIsGood ? '吉方' : '凶方'}，等级 ${report.doorGoodLevel ?? report.doorBadLevel}）`,
    `【4 大吉方】${report.goodDirections.map(d => `${d.cn}（${d.levelName}）`).join('、')}`,
    `【4 大凶方】${report.badDirections.map(d => `${d.cn}（${d.levelName}）`).join('、')}`,
    `【综合评分】${report.score} / 100`,
    `【免费·命卦速览】${report.free.gua.content}`,
    `【免费·大门诊断】${report.free.door.content}`,
    `【免费·家庭和谐】${report.free.harmony.content}`,
    `【付费·化解方案】${report.paid.remedy.content}`,
    `【付费·流年气运】${report.paid.yearEnergy.content}`,
    `【付费·空间赋能】${report.paid.empower.content}`,
  ].join('\n');

  return {
    name: report.input.name,
    user_name: report.input.name,
    gender: report.input.gender,
    // Dify input form 把这些声明为 text-input（字符串），必须 string
    birth_year: String(report.input.birthYear),
    area: String(report.input.area),
    score: String(report.score),
    family_structure: report.input.familyStructure,
    door_direction: report.doorCn,
    door_is_good: String(report.doorIsGood),
    gua_cn: report.guaCn,
    gua_element: report.guaElement,
    gua_group: report.guaGroup,
    gua_method: report.guaMethod,
    gua_number: String(report.guaNumber),
    good_directions: report.goodDirections.map(d => d.cn).join('、'),
    bad_directions: report.badDirections.map(d => d.cn).join('、'),
    report_type: 'house',
    report_context: reportContext,
    // Dify 端常用别名
    profile_data: reportContext,
    context: reportContext,
    user_profile: reportContext,
  };
}

// —— 流式调 Dify ——
async function callDifyStream(
  inputs: Record<string, unknown>,
  query: string,
  user: string,
  conversationId: string | undefined,
): Promise<{ ok: true; body: ReadableStream<Uint8Array>; contentType: string }
       | { ok: false; error: string }> {
  const apiKey = process.env.DIFY_HOUSE_API_KEY;
  if (!apiKey) return { ok: false, error: 'DIFY_HOUSE_API_KEY 未配置' };

  const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');

  const body: Record<string, unknown> = {
    inputs,
    query,
    response_mode: 'streaming',
    user: user || 'lingjingge-house-user',
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

// —— 本地模板（JSON 降级）——
function buildFallbackText(report: ReturnType<typeof checkHouseRules>, errorMsg: string): string {
  return [
    `🏠 ${report.input.name} 的家居环境 · 空间能量诊断`,
    `命卦：${report.guaCn}（${report.guaElement}·${report.guaGroup === 'east' ? '东四命' : '西四命'}）· 评分：${report.score} / 100`,
    ``,
    `【大门诊断】${report.free.door.content}`,
    ``,
    `【4 吉方】${report.free.goodDir.content}`,
    ``,
    `【4 凶方】${report.free.badDir.content}`,
    ``,
    `【家庭和谐】${report.free.harmony.content}`,
    ``,
    `【化解方案】${report.paid.remedy.content}`,
    ``,
    `【流年气运】${report.paid.yearEnergy.content}`,
    ``,
    `【空间赋能】${report.paid.empower.content}`,
    ``,
    `（注：本次未接通 Dify，已使用本地模板。原始错误：${errorMsg}）`,
  ].join('\n');
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
    const report = checkHouseRules(input);
    const inputs = reportToInputs(report);

    const query = `你是一位资深的家居空间能量顾问（不是算命先生），擅长把玄空大卦的命理智慧转化为现代居住者能立刻用上的空间调整建议。用户的命卦是「${report.guaCn}（属${report.guaElement}，${report.guaGroup === 'east' ? '东四命' : '西四命'}）」，大门朝向：${report.doorCn}（${report.doorIsGood ? '吉方' : '凶方'}）。房屋面积 ${report.input.area}㎡，家庭结构：${report.input.familyStructure}。综合评分 ${report.score} / 100。

请基于以上信息，写一份 500-700 字的《空间能量觉醒指南》。

要求：
1. 严禁只说"摆绿植/挂山水画"这种空话，必须给出**具体、可执行**的家居调整建议（如：'天医位适合放金边虎皮兰，能促进夫妻关系'）；
2. 报告标题：《家居环境 · ${report.input.name}的空间能量觉醒》；
3. 分四段呈现：
   ① 一句话点题（把【${report.guaCn}卦·${report.guaElement}】的命格特质转化为一句富有哲理的话 —— 说明这个人的空间能量底色是什么，最适合的家居风格是什么）；
   ② 空间地图（3 条具体空间调整建议，告诉用户"如何把 ${report.guaCn} 命的能量在家中用出来"）；
   ③ 命卦 × 大门（${report.doorCn}方的吉凶诊断 + 化解/加固建议）；
   ④ 结尾给出 **1 条可立刻执行的"空间赋能小行动"**（如：在某方位放一物、调整一个动线、清理一处杂物）。
4. 必须出现：${report.input.name}、${report.guaCn}、${report.guaElement}、${report.doorCn}、${report.input.familyStructure}、${report.guaGroup === 'east' ? '东四命' : '西四命'}。
5. 强调"现代生活智慧"而非"生硬古籍术语" —— 你的建议需结合现代生活习惯，如：'天医位适合放绿植，能促进家庭和睦'，而不是引用古籍原文。
6. 语言温暖、有可操作性，避免绝对化判断。`;

    try {
      const stream = await callDifyStream(
        inputs,
        query,
        user || `house-${input.name}-${input.birthYear}`,
        conversation_id
      );

      if (stream.ok) {
        return new Response(stream.body, {
          status: 200,
          headers: {
            'Content-Type': stream.contentType,
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
            'X-House-Source': 'dify-streaming',
          },
        });
      }

      console.warn('[api/house/polish] Dify 流式失败，回退到 JSON:', stream.error);
      const fb = buildFallbackText(report, stream.error);
      return NextResponse.json(
        { success: true, source: 'local-template', polished: fb, error: stream.error },
        { status: 200 }
      );
    } catch (err) {
      console.warn('[api/house/polish] 异常，降级到 JSON:', err);
      const fallback = buildFallbackText(report, err instanceof Error ? err.message : '未知错误');
      return NextResponse.json(
        { success: true, source: 'local-template', polished: fallback, error: err instanceof Error ? err.message : '未知' },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error('[api/house/polish] 错误:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}
