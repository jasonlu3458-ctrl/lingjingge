// ============================================================
// /api/education/polish —— 子女学业报告 · Dify 润色接口
// 调用真实 Dify（key: DIFY_EDUCATION_API_KEY），Dify 端把
// 由 /api/education 计算好的八字/星位/饮食/书桌建议润色为
// 一段通俗、温暖、可读的中文报告。
//
// 协议参考 /api/dify/route.ts：
//   POST {api.dify.ai}/v1/chat-messages
//   body: { inputs, query, response_mode, user, conversation_id? }
//   auth:  Bearer <DIFY_EDUCATION_API_KEY>
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkEducationRules } from '@/lib/education-rules';

export const runtime = 'nodejs';
export const maxDuration = 60; // 给 Dify 30s 足够

const InputSchema = z.object({
  name: z.string().min(1),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  calendarType: z.enum(['solar', 'lunar']),
  grade: z.string().optional(),
  user: z.string().optional(),
  conversation_id: z.string().optional(),
});

/**
 * 把 /api/education 风格的报告压成 Dify 友好的 inputs。
 * Dify 工作流通常会从 inputs 读取结构化字段；query 仅作触发说明。
 */
function reportToInputs(report: ReturnType<typeof checkEducationRules>) {
  return {
    name: report.input.name,
    grade: report.input.grade || '',
    solar_date: report.bazi.solarDate,
    lunar_date: report.bazi.lunarDate,
    bazi_year: report.bazi.yearGanzhi,
    bazi_month: report.bazi.monthGanzhi,
    bazi_day: report.bazi.dayGanzhi,
    year_zodiac: report.bazi.yearZodiac,
    day_stem: report.bazi.dayStem,
    year_branch: report.bazi.yearBranch,
    season_type: report.season.type,
    season_label: report.season.label,
    season_range: report.season.range,
    free_origin: report.free.origin.content,
    free_talent_trait: report.free.talent.trait,
    free_talent_style: report.free.talent.style,
    code_wenchang: report.free.code.wenchang,
    code_xuetang: report.free.code.xuetang,
    code_ciguan: report.free.code.ciguan,
    code_huagai: report.free.code.huagai,
    code_guceng: report.free.code.guceng,
    code_guagu: report.free.code.guagu,
    food: report.free.food.content,
    desk_direction: report.free.studyRoom.deskDirection,
    desk_mascot: report.free.studyRoom.mascot,
    desk_footpad: report.free.studyRoom.footpadColor,
    desk_house: report.free.studyRoom.house,
    paid_clothing: report.paid.clothing.content,
    paid_housing: report.paid.housing.content,
    paid_travel: report.paid.travel.content,
    paid_boost: report.paid.boost.content,
    paid_mindset: report.paid.mindset.content,
    // 必填字段：report_type（区分报告大类）
    report_type: 'education',
    // 必填字段：report_context（拼成结构化文本，传给 Dify 工作流）
    report_context: [
      `【孩子基本信息】姓名：${report.input.name}，年级：${report.input.grade || '未填'}，生日：${report.bazi.solarDate}（农历 ${report.bazi.lunarDate}），生肖：${report.bazi.yearZodiac}`,
      `【八字】年柱 ${report.bazi.yearGanzhi} 月柱 ${report.bazi.monthGanzhi} 日柱 ${report.bazi.dayGanzhi}（日干 ${report.bazi.dayStem}）`,
      `【命格溯源】${report.free.origin.content}`,
      `【天赋解读】特质：${report.free.talent.trait}；学习方式：${report.free.talent.style}`,
      `【学霸密码】文昌 ${report.free.code.wenchang} / 学堂 ${report.free.code.xuetang} / 词馆 ${report.free.code.ciguan} / 华盖 ${report.free.code.huagai} / 孤辰 ${report.free.code.guceng} / 寡宿 ${report.free.code.guagu}`,
      `【饮食】${report.free.food.content}`,
      `【书桌】朝向：${report.free.studyRoom.deskDirection}；摆件：${report.free.studyRoom.mascot}；地垫：${report.free.studyRoom.footpadColor}；位置：${report.free.studyRoom.house}`,
      `【衣着】${report.paid.clothing.content}`,
      `【居住】${report.paid.housing.content}`,
      `【出行】${report.paid.travel.content}`,
      `【提分】${report.paid.boost.content}`,
      `【心态】${report.paid.mindset.content}`,
    ].join('\n'),
  };
}

/**
 * 调 Dify。response_mode 用 'blocking' 一次性返回（前端 setPolished 一次性吃）。
 * 如果 Dify 流式响应解析失败，自动回退到本地模板。
 */
async function callDify(inputs: Record<string, unknown>, query: string, user: string, conversationId?: string): Promise<string> {
  const apiKey = process.env.DIFY_EDUCATION_API_KEY || process.env.NEXT_PUBLIC_DIFY_EDUCATION_API_KEY;
  if (!apiKey) throw new Error('DIFY_EDUCATION_API_KEY 未配置');

  const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');

  const body: Record<string, unknown> = {
    inputs,
    query,
    response_mode: 'blocking',
    user: user || 'lingjingge-education-user',
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
  // Dify blocking 返回字段：answer；workflow 可能用 'data.outputs' 或 'outputs'
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

    const { name, birthDate, calendarType, grade, user, conversation_id } = parsed.data;

    // 1. 本地算八字 + 星位（用同一份 education-rules，前后端结果一致）
    const report = checkEducationRules({ name, birthDate, calendarType, grade });
    const inputs = reportToInputs(report);

    // 2. 构造 query —— 给 Dify 的明确指令
    const query = `请基于以上孩子的八字（${inputs.bazi_year} ${inputs.bazi_month} ${inputs.bazi_day}）、星位（文昌 ${inputs.code_wenchang} / 学堂 ${inputs.code_xuetang} / 华盖 ${inputs.code_huagai}）和饮食书桌建议，写一份温暖、通俗、可读的子女学业成长报告（800 字以内，分段呈现，包含一句话总结 + 5 个分点建议）。` ;

    // 3. 调真实 Dify
    try {
      const polished = await callDify(inputs, query, user || `edu-${name}-${birthDate}`, conversation_id);
      return NextResponse.json({ success: true, source: 'dify', polished, conversation_id });
    } catch (err) {
      console.warn('[api/education/polish] Dify 失败，回退到本地模板:', err);
      // 降级：拼装一份本地模板
      const fallback = [
        `🌱 一句话总结`,
        `${report.input.name}（${report.bazi.solarDate}，${report.bazi.yearZodiac}年），日柱 ${report.bazi.dayGanzhi}，当前${report.season.label}，是一颗有自己节律的小种子。`,
        ``,
        `📚 学习密码`,
        `文昌在 ${report.free.code.wenchang} 位、学堂在 ${report.free.code.xuetang} 位——把书桌朝 ${report.free.studyRoom.deskDirection} 摆放，能更好地点燃他/她的学习兴趣。`,
        ``,
        `🍵 饮食配合`,
        report.free.food.content,
        ``,
        `✨ 家长可做`,
        report.paid.mindset.content,
        ``,
        `（注：本次未接通 Dify，已使用本地模板。原始错误：${err instanceof Error ? err.message : '未知'}）`,
      ].join('\n');
      return NextResponse.json({ success: true, source: 'local-template', polished: fallback });
    }
  } catch (err) {
    console.error('[api/education/polish] 错误:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'POST { name, birthDate:YYYY-MM-DD, calendarType:solar|lunar, grade?, user?, conversation_id? } to polish an education report via Dify.',
    hasDifyKey: Boolean(process.env.DIFY_EDUCATION_API_KEY || process.env.NEXT_PUBLIC_DIFY_EDUCATION_API_KEY),
  });
}
