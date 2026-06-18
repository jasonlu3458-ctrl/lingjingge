// ============================================================
// /api/marriage/polish —— 婚姻家庭合婚报告 · Dify 润色接口
// 调用真实 Dify（key: DIFY_MARRIAGE_API_KEY），Dify 端把
// 由 /api/marriage 计算好的双八字 / 关系状态 / 痛点润色为
// 一段通俗、温暖、可读的中文报告。
//
// 协议参考 /api/education/polish/route.ts：
//   POST {api.dify.ai}/v1/chat-messages
//   body: { inputs, query, response_mode, user, conversation_id? }
//   auth:  Bearer <DIFY_MARRIAGE_API_KEY>
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkMarriageRules } from '@/lib/marriage-rules';

export const runtime = 'nodejs';
export const maxDuration = 60;

const PersonSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(['female', 'male']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthHour: z.number().int().min(0).max(23),
  calendarType: z.enum(['solar', 'lunar']),
});

const InputSchema = z.object({
  self: PersonSchema,
  partner: PersonSchema,
  relationshipStatus: z.enum(['dating', 'early-marriage', 'long-marriage', 'crisis']),
  painPoints: z.array(z.enum(['personality', 'inlaws', 'wealth', 'children', 'private'])).default([]),
  user: z.string().optional(),
  conversation_id: z.string().optional(),
});

/**
 * 把 MarriageReport 压成 Dify 友好的 inputs。
 * Dify 工作流通常从 inputs 读取结构化字段；query 仅作触发说明。
 */
function reportToInputs(report: ReturnType<typeof checkMarriageRules>) {
  const c = report.compatibility;
  return {
    // 双方基本信息
    self_name: report.input.self.name,
    self_gender: report.input.self.gender,
    self_solar_date: report.selfBazi.solarDate,
    self_lunar_date: report.selfBazi.lunarDate,
    self_bazi_year: report.selfBazi.yearGanzhi,
    self_bazi_month: report.selfBazi.monthGanzhi,
    self_bazi_day: report.selfBazi.dayGanzhi,
    self_zodiac: report.selfBazi.yearZodiac,
    self_day_stem: report.selfBazi.dayStem,
    self_day_branch: report.selfBazi.dayBranch,
    self_five_element: report.selfBazi.fiveElement,
    self_da_yun_1: report.selfBazi.daYun[0]?.ganzhi || '',
    self_da_yun_2: report.selfBazi.daYun[1]?.ganzhi || '',

    partner_name: report.input.partner.name,
    partner_gender: report.input.partner.gender,
    partner_solar_date: report.partnerBazi.solarDate,
    partner_lunar_date: report.partnerBazi.lunarDate,
    partner_bazi_year: report.partnerBazi.yearGanzhi,
    partner_bazi_month: report.partnerBazi.monthGanzhi,
    partner_bazi_day: report.partnerBazi.dayGanzhi,
    partner_zodiac: report.partnerBazi.yearZodiac,
    partner_day_stem: report.partnerBazi.dayStem,
    partner_day_branch: report.partnerBazi.dayBranch,
    partner_five_element: report.partnerBazi.fiveElement,
    partner_da_yun_1: report.partnerBazi.daYun[0]?.ganzhi || '',
    partner_da_yun_2: report.partnerBazi.daYun[1]?.ganzhi || '',

    // 关系状态与痛点
    relationship_status: report.input.relationshipStatus,
    pain_points: report.input.painPoints.join(','),

    // 合婚比对结果
    compat_score: c.score,
    compat_level: c.level,
    compat_level_hint: c.levelHint,
    year_branch_relation: c.yearBranch.relation,
    year_branch_detail: c.yearBranch.detail,
    day_stem_relation: c.dayStem.relation,
    day_stem_detail: c.dayStem.detail,
    day_branch_relation: c.dayBranch.relation,
    day_branch_detail: c.dayBranch.detail,
    shensha_items: c.shenSha.items.join('、') || '无',
    shensha_description: c.shenSha.description,

    // 报告类型
    report_type: 'marriage',
    // 给 Dify 的结构化文本（含双方八字 + 比对 + 关系状态 + 痛点）
    report_context: [
      `【${report.input.self.name}】${report.selfBazi.solarDate}（农历 ${report.selfBazi.lunarDate}），生肖 ${report.selfBazi.yearZodiac}，日柱 ${report.selfBazi.dayGanzhi}（${report.selfBazi.fiveElement}），大运 ${report.selfBazi.daYun.map(d => d.ganzhi).join(' → ')}`,
      `【${report.input.partner.name}】${report.partnerBazi.solarDate}（农历 ${report.partnerBazi.lunarDate}），生肖 ${report.partnerBazi.yearZodiac}，日柱 ${report.partnerBazi.dayGanzhi}（${report.partnerBazi.fiveElement}），大运 ${report.partnerBazi.daYun.map(d => d.ganzhi).join(' → ')}`,
      `【合婚分数】${c.score} 分（${c.level}）—— ${c.levelHint}`,
      `【年支】${c.yearBranch.self} 与 ${c.yearBranch.partner}：${c.yearBranch.relation} —— ${c.yearBranch.detail}`,
      `【日干】${c.dayStem.self} 与 ${c.dayStem.partner}：${c.dayStem.relation} —— ${c.dayStem.detail}`,
      `【日支】${c.dayBranch.self} 与 ${c.dayBranch.partner}：${c.dayBranch.relation} —— ${c.dayBranch.detail}`,
      `【神煞】${c.shenSha.items.join('、') || '无'} —— ${c.shenSha.description}`,
      `【关系状态】${relationshipStatusText(report.input.relationshipStatus)}`,
      `【核心痛点】${painPointsText(report.input.painPoints)}`,
      `【付费内容-流年】${report.paid.yearlyFortune.years.map(y => `${y.year}年：${y.theme}`).join('；')}`,
      `【付费内容-婚期】${report.paid.weddingTiming.bestYear} 年 ${report.paid.weddingTiming.bestMonth} —— ${report.paid.weddingTiming.reason}`,
      `【付费内容-风水】${report.paid.fengShui.bedroom}；客厅：${report.paid.fengShui.livingRoom}；夫妻位：${report.paid.fengShui.coupleCorner}；物品：${report.paid.fengShui.items}`,
    ].join('\n'),
  };
}

function relationshipStatusText(s: string) {
  return {
    'dating': '恋爱中',
    'early-marriage': '已婚（早期）',
    'long-marriage': '已婚（多年）',
    'crisis': '面临危机',
  }[s] || s;
}

function painPointsText(p: string[]) {
  const map: Record<string, string> = {
    'personality': '性格互补',
    'inlaws': '婚后家庭/婆媳',
    'wealth': '双方财运',
    'children': '子女缘分',
    'private': '私密话题（亲密关系和谐度）',
  };
  return p.length > 0 ? p.map(x => map[x] || x).join('、') : '未指定';
}

/**
 * 调 Dify。response_mode 用 'blocking' 一次性返回。
 * 如果 Dify 流式响应解析失败，自动回退到本地模板。
 */
async function callDify(inputs: Record<string, unknown>, query: string, user: string, conversationId?: string): Promise<string> {
  const apiKey = process.env.DIFY_MARRIAGE_API_KEY || process.env.NEXT_PUBLIC_DIFY_MARRIAGE_API_KEY;
  if (!apiKey) throw new Error('DIFY_MARRIAGE_API_KEY 未配置');

  const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');

  const body: Record<string, unknown> = {
    inputs,
    query,
    response_mode: 'blocking',
    user: user || 'lingjingge-marriage-user',
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

    const { self, partner, relationshipStatus, painPoints, user, conversation_id } = parsed.data;

    // 1. 本地算双八字 + 比对
    const report = checkMarriageRules({ self, partner, relationshipStatus, painPoints });
    const inputs = reportToInputs(report);

    // 2. 构造 query —— 给 Dify 的明确指令
    const query = `你是婚姻家庭咨询师。请基于 ${report.input.self.name}（${inputs.self_solar_date}，${inputs.self_zodiac}年，日柱 ${inputs.self_bazi_day}）与 ${report.input.partner.name}（${inputs.partner_solar_date}，${inputs.partner_zodiac}年，日柱 ${inputs.partner_bazi_day}）的八字比对结果（合婚分数 ${inputs.compat_score}，${inputs.compat_level}），结合【关系状态：${relationshipStatusText(relationshipStatus)}】和【核心痛点：${painPointsText(painPoints)}】，写一份 600-800 字的婚姻关系报告。\n\n要求：\n1. 客观、温暖、有可操作性，避免绝对化判断；\n2. 开头用一句话点题（不要"在八字中"开头的程式化语言）；\n3. 中间按痛点顺序给 2-4 条具体建议（每条 2-3 句话）；\n4. 结尾用 1 句温柔鼓励；\n5. 文中必须出现：${report.input.self.name}、${report.input.partner.name}、当前关系状态、用户最关心的痛点。`;

    // 3. 调真实 Dify
    try {
      const polished = await callDify(
        inputs,
        query,
        user || `mrg-${self.name}-${partner.name}-${self.birthDate}`,
        conversation_id
      );
      return NextResponse.json({ success: true, source: 'dify', polished, conversation_id });
    } catch (err) {
      console.warn('[api/marriage/polish] Dify 失败，回退到本地模板:', err);
      // 降级：拼装一份本地模板
      const fallback = [
        `💞 ${report.input.self.name} 与 ${report.input.partner.name} —— 合婚简报`,
        `双方缘分：${report.compatibility.score} 分（${report.compatibility.level}）。${report.compatibility.levelHint}`,
        ``,
        `【核心匹配】`,
        ...report.free.coreMatch.bullets.map(b => `· ${b}`),
        ``,
        `【相处建议】`,
        ...report.free.tips.items.map((t, i) => `${i + 1}. ${t}`),
        ``,
        `（注：本次未接通 Dify，已使用本地模板。原始错误：${err instanceof Error ? err.message : '未知'}）`,
      ].join('\n');
      return NextResponse.json({ success: true, source: 'local-template', polished: fallback });
    }
  } catch (err) {
    console.error('[api/marriage/polish] 错误:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'POST { self, partner, relationshipStatus, painPoints, user?, conversation_id? } to polish a marriage report via Dify.',
    hasDifyKey: Boolean(process.env.DIFY_MARRIAGE_API_KEY || process.env.NEXT_PUBLIC_DIFY_MARRIAGE_API_KEY),
  });
}
