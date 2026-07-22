export const dynamic = 'force-dynamic';

// ============================================================
// /api/wealth/polish —— 事业财富报告 · Dify 润色接口
// 调真实 Dify（key 复用 DIFY_MARRIAGE_API_KEY），Dify 端把
// 由 /api/wealth 计算好的财星/谋财方式/时机节点润色为
// 一段通俗、温暖、可执行的"智富指南"。
//
// 协议参考 /api/dify/route.ts：
//   POST {api.dify.ai}/v1/chat-messages
//   body: { inputs, query, response_mode, user, conversation_id? }
//   auth:  Bearer <DIFY_*_API_KEY>
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkWealthRules } from '@/lib/wealth-rules';

export const runtime = 'nodejs';
export const maxDuration = 60;

const InputSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(['female', 'male']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthHour: z.number().int().min(0).max(23).default(12),
  calendarType: z.enum(['solar', 'lunar']),
  career: z.enum(['互联网', '金融', '制造', '教育', '服务业', '自由职业', '其他']),
  user: z.string().optional(),
  conversation_id: z.string().optional(),
});

function reportToInputs(report: ReturnType<typeof checkWealthRules>) {
  const reportContext = [
    `【用户基本信息】姓名：${report.input.name}，性别：${report.input.gender === 'female' ? '女' : '男'}，当前职业：${report.input.career}`,
    `【八字】年柱 ${report.bazi.yearGanzhi} 月柱 ${report.bazi.monthGanzhi} 日柱 ${report.bazi.dayGanzhi}（日干 ${report.bazi.dayStem}，属${report.bazi.dayElement}），生肖：${report.bazi.yearZodiac}`,
    `【财星方向】日干属${report.bazi.dayElement}，以「${report.wealthSource.element}」为财（财星天干 ${report.wealthSource.wealthStem}）；方位：${report.wealthSource.direction}；适配行业：${report.wealthSource.industries}`,
    `【谋财方式】年支 ${report.bazi.yearBranch}，属${report.careerType.type}（${report.careerType.strength}）。建议工作方式：${report.careerType.workMode}——${report.careerType.workModeReason}`,
    `【职业匹配】当前职业「${report.input.career}」与财星 ${report.wealthSource.element} 匹配度：${report.career.match}（${report.career.matchLabel}）。建议：${report.career.tip}`,
    `【时机节点】当前季节：${report.timing.season.label}（${report.timing.season.range}），与日干${report.timing.season.type}的能量关系为「${report.timing.phase}」——${report.timing.tone}。最佳窗口：${report.timing.bestSeason}；${report.timing.bestYear}年是重点布局年。`,
    `【免费版块】${report.free.origin.content} / ${report.free.fangxiang.content} / ${report.free.gongzhan.content} / ${report.free.shijian.content} / ${report.free.yishi.content}`,
    `【付费·流年】${report.paid.qushi.content}`,
    `【付费·家庭财富池】${report.paid.jiating.content}`,
    `【付费·管理用人】${report.paid.guanli.content}`,
    `【付费·防坑指南】${report.paid.fangkeng.content}`,
    `【付费·3 步落地】${report.paid.zhidao.content}`,
    `【综合评分】${report.score} / 100`,
  ].join('\n');

  return {
    name: report.input.name,
    user_name: report.input.name, // 兼容 Dify 端用 user_name 命名的输入变量
    gender: report.input.gender,
    career: report.input.career,
    solar_date: report.bazi.solarDate,
    lunar_date: report.bazi.lunarDate,
    bazi_year: report.bazi.yearGanzhi,
    bazi_month: report.bazi.monthGanzhi,
    bazi_day: report.bazi.dayGanzhi,
    year_zodiac: report.bazi.yearZodiac,
    day_stem: report.bazi.dayStem,
    day_element: report.bazi.dayElement,
    year_branch: report.bazi.yearBranch,
    wealth_element: report.wealthSource.element,
    wealth_stem: report.wealthSource.wealthStem,
    wealth_direction: report.wealthSource.direction,
    wealth_industries: report.wealthSource.industries,
    career_type: report.careerType.type,
    career_work_mode: report.careerType.workMode,
    season_type: report.timing.season.type,
    season_label: report.timing.season.label,
    season_phase: report.timing.phase,
    best_season: report.timing.bestSeason,
    best_year: report.timing.bestYear,
    career_match: report.career.match,
    career_match_label: report.career.matchLabel,
    score: report.score,
    // 报告类型
    report_type: 'wealth',
    // 结构化文本
    report_context: reportContext,
    // Dify 端常用别名：profile_data / context / user_profile / bazi_data
    profile_data: reportContext,
    context: reportContext,
    user_profile: reportContext,
    bazi_data: reportContext,
  };
}

async function callDify(inputs: Record<string, unknown>, query: string, user: string, conversationId?: string): Promise<string> {
  // 事业财富模块当前复用婚姻的 Dify key（如有专用 key 可在此处切换）
  const apiKey = process.env.DIFY_WEALTH_API_KEY || process.env.DIFY_MARRIAGE_API_KEY;
  if (!apiKey) throw new Error('DIFY_WEALTH_API_KEY / DIFY_MARRIAGE_API_KEY 未配置');

  const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');

  const body: Record<string, unknown> = {
    inputs,
    query,
    response_mode: 'blocking',
    user: user || 'lingjingge-wealth-user',
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

    // 1. 本地算（财星 + 谋财方式 + 时机节点）
    const report = checkWealthRules(input);
    const inputs = reportToInputs(report);

    // 2. 构造 query —— 给 Dify 的明确指令
    const query = `你是一位在硅谷和华尔街都有实战经验的东方命理与商业战略顾问。用户的当前职业是「${input.career}」，日柱 ${inputs.bazi_day}（属${inputs.day_element}），命中以「${inputs.wealth_element}」为财（财星天干 ${inputs.wealth_stem}），建议工作方式为「${inputs.career_work_mode}」。

请基于以上信息，结合【综合评分 ${inputs.score} / 100】和【最佳窗口 ${inputs.best_season}、${inputs.best_year} 年】，写一份通俗易懂、500-700 字的《事业财富破局指南》（智富心法）。

要求：
1. 严禁只说"你财运很好" / "今年有横财"这种空话，必须给出**具体行动建议**；
2. 报告标题：《事业智富 · ${report.input.name}的破局之道》；
3. 分四段呈现：① 一句话点题（基于日干 + 职业匹配度）；② 财源方向（产业 / 方位 / 颜色，3 条具体建议）；③ 谋财方式（当前季节 + 大运 + 打工/创业/合伙）；④ 结尾给出 **1 条可立刻执行的"智富小行动"**（如：联系某位旧同事、整理一份个人复盘笔记等）。
4. 必须出现：${report.input.name}、${input.career}、财星 ${inputs.wealth_element}、最佳窗口 ${inputs.best_season}、${inputs.best_year} 年。
5. 语言温暖、有可操作性，避免绝对化判断。`;

    // 3. 调真实 Dify
    try {
      const polished = await callDify(
        inputs,
        query,
        user || `wlth-${input.name}-${input.birthDate}-${input.career}`,
        conversation_id
      );
      return NextResponse.json({ success: true, source: 'dify', polished, conversation_id });
    } catch (err) {
      console.warn('[api/wealth/polish] Dify 失败，回退到本地模板:', err);
      const fallback = [
        `💎 ${report.input.name} 的事业智富 · 破局之道`,
        `综合评分：${report.score} / 100（${report.career.matchLabel}）`,
        ``,
        `【命格溯源】${report.free.origin.content}`,
        ``,
        `【财源方向】${report.free.fangxiang.content}`,
        ``,
        `【谋财方式】${report.free.gongzhan.content}`,
        ``,
        `【时机节点】${report.free.shijian.content}`,
        ``,
        `【智富小语】${report.free.yishi.content}`,
        ``,
        `【付费·未来 3 年流年】${report.paid.qushi.content}`,
        ``,
        `【付费·家庭财富池】${report.paid.jiating.content}`,
        ``,
        `【付费·管理用人】${report.paid.guanli.content}`,
        ``,
        `【付费·防坑指南】${report.paid.fangkeng.content}`,
        ``,
        `【付费·3 步落地清单】${report.paid.zhidao.content}`,
        ``,
        `（注：本次未接通 Dify，已使用本地模板。原始错误：${err instanceof Error ? err.message : '未知'}）`,
      ].join('\n');
      return NextResponse.json({ success: true, source: 'local-template', polished: fallback });
    }
  } catch (err) {
    console.error('[api/wealth/polish] 错误:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'POST { name, gender, birthDate, birthHour, calendarType, career, user?, conversation_id? } to polish a wealth report via Dify.',
    hasDifyKey: Boolean(process.env.DIFY_WEALTH_API_KEY || process.env.DIFY_MARRIAGE_API_KEY),
  });
}
