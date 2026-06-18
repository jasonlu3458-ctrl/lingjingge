// ============================================================
// marriage-rules.ts —— 婚姻家庭合婚报告 · 业务规则核验
// 用 lunar-javascript 做双八字换算，再两两比对：
//   年支六合 / 三合 / 六冲
//   日干十组生克（10×10 矩阵）
//   日支六合 / 三合 / 六冲
//   神煞：红鸾 / 天喜 / 咸池 / 孤辰 / 寡宿
//   综合打分 0-100
//
// 报告字段与 FamilyPageClient.MarriageReport 完全对齐。
// ============================================================

import { Solar, Lunar } from 'lunar-javascript';

export type Gender = 'female' | 'male';
export type CalendarType = 'solar' | 'lunar';

export interface PersonInput {
  name: string;
  gender: Gender;
  birthDate: string;     // YYYY-MM-DD
  birthHour: number;     // 0-23（小时，未知则传 12）
  calendarType: CalendarType;
}

export type RelationshipStatus = 'dating' | 'early-marriage' | 'long-marriage' | 'crisis';
export type PainPoint = 'personality' | 'inlaws' | 'wealth' | 'children' | 'private';

export interface MarriageInput {
  self: PersonInput;
  partner: PersonInput;
  relationshipStatus: RelationshipStatus;
  painPoints: PainPoint[];
}

export interface BaziInfo {
  yearGanzhi: string;
  monthGanzhi: string;
  dayGanzhi: string;
  yearBranch: string;
  dayStem: string;
  dayBranch: string;
  yearZodiac: string;
  solarDate: string;
  lunarDate: string;
  fiveElement: string;  // 日干五行
  daYun: { start: number; ganzhi: string }[]; // 大运（简化：列 3 步）
}

export interface CompatibilityResult {
  score: number;              // 0-100
  level: '上等姻缘' | '中等姻缘' | '需经营';
  levelHint: string;
  yearBranch: {
    self: string;
    partner: string;
    relation: '六合' | '三合' | '六冲' | '无显著关系';
    detail: string;
  };
  dayStem: {
    self: string;
    partner: string;
    relation: '相生' | '比合' | '相克' | '中性';
    detail: string;
  };
  dayBranch: {
    self: string;
    partner: string;
    relation: '六合' | '三合' | '六冲' | '无显著关系';
    detail: string;
  };
  shenSha: {
    items: string[];          // ['红鸾星动', '咸池桃花', ...]
    description: string;
  };
  scoreBreakdown: {
    yearBranch: number;       // 满分 25
    dayStem: number;          // 满分 30
    dayBranch: number;        // 满分 25
    shenSha: number;          // 满分 20
  };
}

export interface MarriageReport {
  input: {
    self: { name: string; gender: Gender; birthDate: string };
    partner: { name: string; gender: Gender; birthDate: string };
    relationshipStatus: RelationshipStatus;
    painPoints: PainPoint[];
  };
  selfBazi: BaziInfo;
  partnerBazi: BaziInfo;
  compatibility: CompatibilityResult;
  free: {
    overview: { title: string; content: string; source: string };
    personality: { title: string; selfTrait: string; partnerTrait: string; blend: string };
    coreMatch: { title: string; bullets: string[] };
    tips: { title: string; items: string[] };
  };
  paid: {
    yearlyFortune: { title: string; years: { year: number; theme: string; advice: string }[] };
    weddingTiming: { title: string; bestYear: number; bestMonth: string; reason: string };
    fengShui: { title: string; bedroom: string; livingRoom: string; coupleCorner: string; items: string };
  };
}

// ============================================================
// 工具：日期 / 五行 / 干支
// ============================================================
function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

function formatSolar(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildSolarFromInput(p: PersonInput): Date {
  if (p.calendarType === 'solar') {
    const [y, m, d] = p.birthDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const [y, m, d] = p.birthDate.split('-').map(Number);
  const lunar = Lunar.fromYmd(y, m, d);
  const solar = lunar.getSolar();
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
}

const STEM_5E: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

// ============================================================
// 查表 1：年支 六合 / 三合 / 六冲
// ============================================================
const BRANCH_LIUHE: Record<string, string> = {
  子: '丑', 丑: '子',
  寅: '亥', 亥: '寅',
  卯: '戌', 戌: '卯',
  辰: '酉', 酉: '辰',
  巳: '申', 申: '巳',
  午: '未', 未: '午',
};
const BRANCH_SANHE: Record<string, [string, string][]> = {
  // 寅午戌  → 火局
  寅: [['午', '戌'], ['戌', '午']],
  午: [['寅', '戌'], ['戌', '寅']],
  戌: [['寅', '午'], ['午', '寅']],
  // 申子辰  → 水局
  申: [['子', '辰'], ['辰', '子']],
  子: [['申', '辰'], ['辰', '申']],
  辰: [['申', '子'], ['子', '申']],
  // 亥卯未  → 木局
  亥: [['卯', '未'], ['未', '卯']],
  卯: [['亥', '未'], ['未', '亥']],
  未: [['亥', '卯'], ['卯', '亥']],
  // 巳酉丑  → 金局
  巳: [['酉', '丑'], ['丑', '酉']],
  酉: [['巳', '丑'], ['丑', '巳']],
  丑: [['巳', '酉'], ['酉', '巳']],
};
const BRANCH_LIUCHONG: Record<string, string> = {
  子: '午', 午: '子',
  丑: '未', 未: '丑',
  寅: '申', 申: '寅',
  卯: '酉', 酉: '卯',
  辰: '戌', 戌: '辰',
  巳: '亥', 亥: '巳',
};

function checkYearBranch(b1: string, b2: string) {
  if (BRANCH_LIUHE[b1] === b2) {
    return { relation: '六合' as const, detail: `年支${b1}与${b2}为「子丑合」类六合，祖上和顺、家庭认同度高。` };
  }
  const sanheList = BRANCH_SANHE[b1] || [];
  for (const pair of sanheList) {
    if (pair[0] === b2 || pair[1] === b2) {
      return { relation: '三合' as const, detail: `年支${b1}、${b2}同属三合局（${sanheElement(b1)}局），气场相吸引，三观较一致。` };
    }
  }
  if (BRANCH_LIUCHONG[b1] === b2) {
    return { relation: '六冲' as const, detail: `年支${b1}与${b2}为六冲（如子午冲），原生家庭观念冲突较多，需多沟通。` };
  }
  return { relation: '无显著关系' as const, detail: '年支无特殊生克合冲关系，性格相安，属中性相合。' };
}
function sanheElement(b: string): string {
  if (['寅', '午', '戌'].includes(b)) return '火';
  if (['申', '子', '辰'].includes(b)) return '水';
  if (['亥', '卯', '未'].includes(b)) return '木';
  if (['巳', '酉', '丑'].includes(b)) return '金';
  return '';
}

// ============================================================
// 查表 2：日干 十组生克（10×10）
// 相生：木→火→土→金→水→木
// 比合：同五行
// 相克：木→土→水→火→金→木
// ============================================================
const STEM_SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const STEM_KE: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

function checkDayStem(s1: string, s2: string) {
  const e1 = STEM_5E[s1];
  const e2 = STEM_5E[s2];
  if (e1 === e2) {
    return { relation: '比合' as const, detail: `日干${s1}与${s2}同属${e1}，气场相近、默契度高，但也容易争强好胜。` };
  }
  if (STEM_SHENG[e1] === e2) {
    return { relation: '相生' as const, detail: `日干${s1}(${e1})生${s2}(${e2})，主动付出型关系，${s1}方会多照顾${s2}方。` };
  }
  if (STEM_SHENG[e2] === e1) {
    return { relation: '相生' as const, detail: `日干${s2}(${e2})生${s1}(${e1})，${s2}方主动支持${s1}方，是温暖的滋养型。` };
  }
  if (STEM_KE[e1] === e2) {
    return { relation: '相克' as const, detail: `日干${s1}(${e1})克${s2}(${e2})，易有控制与被控制的张力，需建立边界。` };
  }
  if (STEM_KE[e2] === e1) {
    return { relation: '相克' as const, detail: `日干${s2}(${e2})克${s1}(${e1})，关系中${s2}方主导，${s1}方要多表达自我。` };
  }
  return { relation: '中性' as const, detail: `日干${s1}(${e1})与${s2}(${e2})为中性关系，既无生克也无比合，相处靠后天经营。` };
}

// ============================================================
// 查表 3：日支（用上面同一个 BRANCH 表查六合/三合/六冲）
// ============================================================
function checkDayBranch(b1: string, b2: string) {
  if (BRANCH_LIUHE[b1] === b2) {
    return { relation: '六合' as const, detail: `日支${b1}与${b2}为六合，婚恋宫位高度契合，是夫妻恩爱的标志。` };
  }
  const sanheList = BRANCH_SANHE[b1] || [];
  for (const pair of sanheList) {
    if (pair[0] === b2 || pair[1] === b2) {
      return { relation: '三合' as const, detail: `日支${b1}、${b2}同属三合${sanheElement(b1)}局，性情相投，生活步调一致。` };
    }
  }
  if (BRANCH_LIUCHONG[b1] === b2) {
    return { relation: '六冲' as const, detail: `日支${b1}与${b2}为六冲（如子午冲），情绪波动大、易争吵，但也是激情型关系。` };
  }
  return { relation: '无显著关系' as const, detail: '日支无合冲关系，相处模式偏平稳。' };
}

// ============================================================
// 查表 4：神煞
//   红鸾：以年支查（子年在卯，丑年在寅，... 顺数到本命位）
//   天喜：红鸾对冲
//   咸池（桃花）：以日支或年支查（申子辰在酉，寅午戌在卯，...）
//   孤辰寡宿：以年支查
// ============================================================
// 简化：红鸾只看男方年支
function checkHongluan(yearBranch: string) {
  // 红鸾口诀：子年在卯，丑年在寅，寅年在丑，卯年在子，辰年在亥，巳年在戌，午年在酉，未年在申，申年在未，酉年在午，戌年在巳，亥年在辰
  const map: Record<string, string> = {
    子: '卯', 丑: '寅', 寅: '丑', 卯: '子',
    辰: '亥', 巳: '戌', 午: '酉', 未: '申',
    申: '未', 酉: '午', 戌: '巳', 亥: '辰',
  };
  return map[yearBranch] || '';
}
function checkTianxi(yearBranch: string) {
  return BRANCH_LIUCHONG[checkHongluan(yearBranch)] || '';
}
function checkXianchi(branch: string) {
  // 咸池（桃花）口诀：申子辰见酉，寅午戌见卯，亥卯未见子，巳酉丑见午
  const map: Record<string, string> = {
    申: '酉', 子: '酉', 辰: '酉',
    寅: '卯', 午: '卯', 戌: '卯',
    亥: '子', 卯: '子', 未: '子',
    巳: '午', 酉: '午', 丑: '午',
  };
  return map[branch] || '';
}
function checkGuchen(yearBranch: string) {
  // 孤辰口诀：申子辰见巳，寅午戌见申，亥卯未见寅，巳酉丑见亥
  const map: Record<string, string> = {
    申: '巳', 子: '巳', 辰: '巳',
    寅: '申', 午: '申', 戌: '申',
    亥: '寅', 卯: '寅', 未: '寅',
    巳: '亥', 酉: '亥', 丑: '亥',
  };
  return map[yearBranch] || '';
}
function checkGuasu(yearBranch: string) {
  // 寡宿口诀：与孤辰对冲
  const gu = checkGuchen(yearBranch);
  return BRANCH_LIUCHONG[gu] || '';
}

// ============================================================
// 主入口
// ============================================================
export function checkMarriageRules(input: MarriageInput): MarriageReport {
  const selfBazi = buildBazi(input.self);
  const partnerBazi = buildBazi(input.partner);

  // 1. 年支
  const yb = checkYearBranch(selfBazi.yearBranch, partnerBazi.yearBranch);
  // 2. 日干
  const ds = checkDayStem(selfBazi.dayStem, partnerBazi.dayStem);
  // 3. 日支
  const db = checkDayBranch(selfBazi.dayBranch, partnerBazi.dayBranch);
  // 4. 神煞
  const shenSha = buildShenSha(selfBazi, partnerBazi);

  // 5. 评分
  const scoreBreakdown = {
    yearBranch: yb.relation === '六合' ? 22 : yb.relation === '三合' ? 20 : yb.relation === '六冲' ? 8 : 14,
    dayStem: ds.relation === '相生' ? 28 : ds.relation === '比合' ? 25 : ds.relation === '相克' ? 12 : 18,
    dayBranch: db.relation === '六合' ? 24 : db.relation === '三合' ? 22 : db.relation === '六冲' ? 9 : 16,
    shenSha: computeShenShaScore(shenSha.items),
  };
  const score = scoreBreakdown.yearBranch + scoreBreakdown.dayStem + scoreBreakdown.dayBranch + scoreBreakdown.shenSha;
  const level: CompatibilityResult['level'] = score >= 80 ? '上等姻缘' : score >= 60 ? '中等姻缘' : '需经营';
  const levelHint = level === '上等姻缘' ? '百年修得同船渡，你们是天生契合的一对。' : level === '中等姻缘' ? '缘分有之，更需用心经营，方能长久。' : '需要彼此更多理解与包容，建议日常多沟通、共同成长。';

  const compatibility: CompatibilityResult = {
    score,
    level,
    levelHint,
    yearBranch: { self: selfBazi.yearBranch, partner: partnerBazi.yearBranch, ...yb },
    dayStem: { self: selfBazi.dayStem, partner: partnerBazi.dayStem, ...ds },
    dayBranch: { self: selfBazi.dayBranch, partner: partnerBazi.dayBranch, ...db },
    shenSha,
    scoreBreakdown,
  };

  return {
    input: {
      self: { name: input.self.name, gender: input.self.gender, birthDate: input.self.birthDate },
      partner: { name: input.partner.name, gender: input.partner.gender, birthDate: input.partner.birthDate },
      relationshipStatus: input.relationshipStatus,
      painPoints: input.painPoints,
    },
    selfBazi,
    partnerBazi,
    compatibility,
    free: {
      overview: buildOverview(selfBazi, partnerBazi, compatibility),
      personality: buildPersonality(selfBazi, partnerBazi),
      coreMatch: buildCoreMatch(compatibility),
      tips: buildTips(input, compatibility),
    },
    paid: {
      yearlyFortune: buildYearlyFortune(selfBazi, partnerBazi),
      weddingTiming: buildWeddingTiming(selfBazi, partnerBazi, compatibility, input.self.name, input.partner.name),
      fengShui: buildFengShui(selfBazi, partnerBazi),
    },
  };
}

// ============================================================
// 内部：双八字信息
// ============================================================
function buildBazi(p: PersonInput): BaziInfo {
  const solar = buildSolarFromInput(p);
  const solarObj = Solar.fromDate(solar);
  const lunarObj = solarObj.getLunar();
  const eightChar = lunarObj.getEightChar();

  const yearGanzhi = eightChar.getYear();
  const monthGanzhi = eightChar.getMonth();
  const dayGanzhi = eightChar.getDay();
  const yearBranch = yearGanzhi.charAt(1);
  const dayStem = dayGanzhi.charAt(0);
  const dayBranch = dayGanzhi.charAt(1);
  const yearZodiac = lunarObj.getYearShengXiao();
  const solarDate = formatSolar(solar);
  const lunarDate = `${lunarObj.getYearInChinese()}年${lunarObj.getMonthInChinese()}月${lunarObj.getDayInChinese()}`;

  // 大运：取月柱后 3 步（简化：直接列月柱 + 顺排 3 个地支）
  const monthBranch = monthGanzhi.charAt(1);
  const daYun: { start: number; ganzhi: string }[] = [];
  // 简化：从月柱开始，每 10 年一步，列 3 步
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const monthIdx = branches.indexOf(monthBranch);
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const monthStemIdx = stems.indexOf(monthGanzhi.charAt(0));
  for (let i = 0; i < 3; i++) {
    const newStem = stems[(monthStemIdx + i + 1) % 10];
    const newBranch = branches[(monthIdx + i + 1) % 12];
    daYun.push({ start: 10 * (i + 1), ganzhi: `${newStem}${newBranch}` });
  }

  return {
    yearGanzhi,
    monthGanzhi,
    dayGanzhi,
    yearBranch,
    dayStem,
    dayBranch,
    yearZodiac,
    solarDate,
    lunarDate,
    fiveElement: STEM_5E[dayStem] || '木',
    daYun,
  };
}

// ============================================================
// 内部：神煞拼装
// ============================================================
function buildShenSha(self: BaziInfo, partner: BaziInfo) {
  const items: string[] = [];
  const selfHL = checkHongluan(self.yearBranch);
  const partnerHL = checkHongluan(partner.yearBranch);
  const selfTX = checkTianxi(self.yearBranch);
  const partnerTX = checkTianxi(partner.yearBranch);
  const selfXC = checkXianchi(self.dayBranch);
  const partnerXC = checkXianchi(partner.dayBranch);
  const selfGC = checkGuchen(self.yearBranch);
  const partnerGS = checkGuasu(partner.yearBranch);

  // 红鸾：一方有而对方无 → 桃花缘深
  if (selfHL || partnerHL) {
    items.push('红鸾星动');
  }
  if (selfTX || partnerTX) {
    items.push('天喜入命');
  }
  if (selfXC || partnerXC) {
    items.push('咸池桃花');
  }
  if (selfGC || partnerGS) {
    items.push('孤辰寡宿（需多主动）');
  }

  const description = items.length === 0
    ? '未见明显桃花神煞，感情发展较平稳。'
    : items.includes('红鸾星动')
      ? '红鸾主婚嫁喜庆，是天作之合的标志；咸池主异性缘与魅力，感情路上多被欣赏。'
      : '咸池入命，异性缘佳，感情丰富；天喜临身，遇事多逢凶化吉。';

  return { items, description };
}

function computeShenShaScore(items: string[]) {
  let s = 10; // 基础分
  if (items.includes('红鸾星动')) s += 5;
  if (items.includes('天喜入命')) s += 3;
  if (items.includes('咸池桃花')) s += 2;
  if (items.includes('孤辰寡宿（需多主动）')) s -= 2;
  return Math.max(0, Math.min(20, s));
}

// ============================================================
// 内部：免费报告段落
// ============================================================
function buildOverview(self: BaziInfo, partner: BaziInfo, c: CompatibilityResult) {
  return {
    title: '💞 一生一会 · 合婚溯源',
    content: `${self.yearZodiac}年${self.fiveElement}命的${self.dayGanzhi}，与${partner.yearZodiac}年${partner.fiveElement}命的${partner.dayGanzhi}，八字契合度为「${c.level}」（${c.score}分）。${c.levelHint}`,
    source: '《三命通会》《子平真诠》《滴天髓》',
  };
}

function buildPersonality(self: BaziInfo, partner: BaziInfo) {
  return {
    title: '🧬 双方性格与互补',
    selfTrait: tianGanTrait(self.dayStem),
    partnerTrait: tianGanTrait(partner.dayStem),
    blend: `二人五行分别属${self.fiveElement}与${partner.fiveElement}，${
      self.fiveElement === partner.fiveElement
        ? '气场相近、默契度高，但也容易在小事上争强。'
        : STEM_SHENG[self.fiveElement] === partner.fiveElement
          ? `${self.fiveElement}生${partner.fiveElement}，主动方多担当，被生方易被宠。`
          : STEM_SHENG[partner.fiveElement] === self.fiveElement
            ? `${partner.fiveElement}生${self.fiveElement}，${partner.dayStem}方会多支持${self.dayStem}方。`
            : '双方互补，差异是关系的礼物。'
    }`,
  };
}

function buildCoreMatch(c: CompatibilityResult) {
  const bullets: string[] = [];
  bullets.push(`【年支】${c.yearBranch.self} 与 ${c.yearBranch.partner}：${c.yearBranch.relation} —— ${c.yearBranch.detail}`);
  bullets.push(`【日干】${c.dayStem.self} 与 ${c.dayStem.partner}：${c.dayStem.relation} —— ${c.dayStem.detail}`);
  bullets.push(`【日支】${c.dayBranch.self} 与 ${c.dayBranch.partner}：${c.dayBranch.relation} —— ${c.dayBranch.detail}`);
  if (c.shenSha.items.length > 0) {
    bullets.push(`【神煞】${c.shenSha.items.join('、')} —— ${c.shenSha.description}`);
  }
  return { title: '🔐 合婚密码', bullets };
}

function buildTips(input: MarriageInput, c: CompatibilityResult) {
  const items: string[] = [];
  if (c.score >= 80) {
    items.push('珍惜缘分，日常多表达感谢，让"默契"不变成"理所当然"。');
  } else if (c.score >= 60) {
    items.push('每周固定 30 分钟"只属于两人的对话时间"，不谈孩子与账单。');
    items.push('冲突时不争对错，先看见对方的情绪，再处理事情。');
  } else {
    items.push('建议一起做一件"小而具体的事"（如每月一次共同爱好），用行动积累信任。');
    items.push('必要时寻求专业婚姻家庭咨询师辅导，无须忌讳。');
  }
  if (input.painPoints.includes('inlaws')) {
    items.push('与原生家庭有边界意识：经济与决策由小家庭主导，亲戚意见只作参考。');
  }
  if (input.painPoints.includes('children')) {
    items.push('子女议题建议提前沟通到"生不生/几个/教育观"三件大事，再谈具体计划。');
  }
  if (input.painPoints.includes('wealth')) {
    items.push('财务透明化：共同账户 + 各自自由账户的比例建议 7:3，避免"谁管钱=谁说了算"。');
  }
  if (input.painPoints.includes('private')) {
    items.push('亲密关系需要"专属仪式感"：固定约会日、一句睡前的话，比昂贵礼物更有效。');
  }
  if (items.length < 2) {
    items.push('保持各自兴趣圈，朋友与社交不必完全重叠，给彼此呼吸空间。');
  }
  return { title: '🧭 相处建议', items };
}

// ============================================================
// 内部：付费报告三大杀手锏
// ============================================================
function buildYearlyFortune(self: BaziInfo, partner: BaziInfo) {
  // 简化：取当前年 2026 起的 3 年 + 每年的"流年天干"（生肖轮转）+ 当年大运节点
  const now = new Date().getFullYear();
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

  const years = [] as { year: number; theme: string; advice: string }[];
  for (let i = 0; i < 3; i++) {
    const y = now + i;
    // 流年天干：1984=甲子，每 60 年一轮回
    const offset = (y - 1984) % 60;
    const stem = stems[offset % 10];
    const branch = branches[offset % 12];
    const ganzhi = `${stem}${branch}`;
    const zodiac = zodiacs[offset % 12];

    // 简单判定：与夫妻日干的关系
    const myRel = STEM_SHENG[STEM_5E[stem]] === self.fiveElement ? '相生' : STEM_KE[STEM_5E[stem]] === self.fiveElement ? '相克' : '中性';
    const paRel = STEM_SHENG[STEM_5E[stem]] === partner.fiveElement ? '相生' : STEM_KE[STEM_5E[stem]] === partner.fiveElement ? '相克' : '中性';

    const theme = i === 0
      ? `${y}年（${ganzhi}${zodiac}年）：磨合期，关系进入新节奏`
      : i === 1
        ? `${y}年（${ganzhi}${zodiac}年）：稳定期，适合一起做规划`
        : `${y}年（${ganzhi}${zodiac}年）：收获期，前两年的积累显现结果`;

    const advice = `流年${ganzhi}对您${myRel}，对伴侣${paRel}。${i === 0 ? '建议这一年多倾听、少做重大决定。' : i === 1 ? '这一年是共同成长的黄金期，可考虑买房、育儿等长期规划。' : '此时适合复盘关系，感恩彼此的付出。'}`;

    years.push({ year: y, theme, advice });
  }

  return {
    title: '📅 未来 3 年流年婚姻运势',
    years,
  };
}

function buildWeddingTiming(self: BaziInfo, partner: BaziInfo, c: CompatibilityResult, selfName: string, partnerName: string) {
  // 简化：取双方大运"相生"或"比合"的年份；找未来 3 年内第一个合适年
  const now = new Date().getFullYear();
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 用大运 ganzhi 与流年比较太复杂，简化为：找男方大运第一步 5 年内的"相生"年
  const firstDaYunStem = self.daYun[0]?.ganzhi.charAt(0) || '甲';
  const firstDaYunBranch = self.daYun[0]?.ganzhi.charAt(1) || '子';
  const selfEl = STEM_5E[firstDaYunStem];
  const partEl = partner.fiveElement;

  let bestYear = now + 1;
  for (let y = now; y < now + 6; y++) {
    const offset = (y - 1984) % 60;
    const stem = stems[offset % 10];
    const branch = branches[offset % 12];
    const ganzhi = `${stem}${branch}`;
    if (BRANCH_LIUHE[branch] === firstDaYunBranch || BRANCH_LIUHE[firstDaYunBranch] === branch) {
      bestYear = y;
      break;
    }
    // 备选：流年地支为夫妻日支之一，且五行相生
    if ((branch === self.dayBranch || branch === partner.dayBranch) && STEM_SHENG[STEM_5E[stem]] === partEl) {
      bestYear = y;
      break;
    }
  }

  // 选月份：5月（午火，主热情）或 10月（戌土，主稳定）
  const bestMonth = self.fiveElement === '火' ? '农历五月（午月）' : self.fiveElement === '金' ? '农历八月（酉月）' : '农历六月（未月）';

  const reason = `从${selfName}的大运「${firstDaYunStem}${firstDaYunBranch}」与${partnerName}的五行情缘推算，${bestYear}年（${firstDaYunBranch === '子' ? '鼠年' : '流年与命局相合'}）是${bestYear === now + 1 ? '最早' : '未来 5 年内'}适合举办婚礼的年份；${bestMonth}则是一年中阳气最稳、利于家庭凝聚的时段。${c.score >= 80 ? '且二人缘分深厚，更宜乘势而定。' : '建议在婚前完成 3-6 个月共同生活的小型"试婚期"，让婚后磨合更顺。'}`;

  return {
    title: '💍 最佳结婚年份与月份',
    bestYear,
    bestMonth,
    reason,
  };
}

function buildFengShui(self: BaziInfo, partner: BaziInfo) {
  // 简化：按夫妻日干主五行推卧室朝向 + 客厅色调 + 夫妻位摆件
  const combined = self.fiveElement + '+' + partner.fiveElement;
  const bedroomMap: Record<string, string> = {
    '木+木': '卧室朝东或东南，门窗避开西冲；床位靠实墙，头朝东睡。',
    '木+火': '卧室朝南或东南；床位坐北朝南，床头靠实墙，避开门冲。',
    '木+土': '卧室居中或东北；床头朝西或西北，地面铺暖色地毯。',
    '木+金': '卧室朝西或西北；床头朝西，地面铺浅色系，避免金属摆件过多。',
    '木+水': '卧室朝北或西北；床头朝北，可加小型流水摆件。',
    '火+火': '卧室朝南，但避免正南；用米白色窗帘中和。',
    '火+土': '卧室居中；床头朝南，暖色灯光。',
    '火+金': '卧室朝西或西北；床头朝西，避免大面积红色。',
    '火+水': '卧室朝北；床头朝北，窗帘用米白色调和。',
    '火+木': '卧室朝东或东南；床头朝东，可放小型绿植。',
    '土+土': '卧室居中或西南；床头朝西或南，黄咖色系为主。',
    '土+金': '卧室朝西；床头朝西，白金配黄咖色。',
    '土+水': '卧室朝北或西北；床头朝北，地面铺暖色。',
    '土+木': '卧室朝东；床头朝东，绿植+黄色软装。',
    '土+火': '卧室朝南；床头朝南，红色+土黄搭配。',
    '金+金': '卧室朝西；床头朝西，白金为主色，避免金属过多。',
    '金+水': '卧室朝西北或北；床头朝北，金白+水蓝。',
    '金+木': '卧室朝东或东南；床头朝东，金白+木绿。',
    '金+火': '卧室朝西；床头朝西，避开红色主调。',
    '金+土': '卧室居中或西南；床头朝西，黄咖+白金。',
    '水+水': '卧室朝北；床头朝北，避免大面积深色。',
    '水+木': '卧室朝东或北；床头朝东或北，水蓝+木绿。',
    '水+火': '卧室朝北；床头朝北，避开红色主调。',
    '水+土': '卧室居中或西北；床头朝北或西。',
    '水+金': '卧室朝西北；床头朝西北，金白+水蓝。',
  };
  const key = `${self.fiveElement}+${partner.fiveElement}`;
  const reverseKey = `${partner.fiveElement}+${self.fiveElement}`;
  const bedroom = bedroomMap[key] || bedroomMap[reverseKey] || '卧室宜安静、避开门冲，床头靠实墙。';

  return {
    title: '🏠 婚后睡房/客厅风水',
    bedroom,
    livingRoom: '客厅宜宽敞明亮、主色调用米白/浅咖等中性色，避免大红大黑。沙发靠实墙，电视墙不冲门。夫妻合照可挂客厅西墙或西南墙，象征"和合"。',
    coupleCorner: '家中西南位（坤位）为"夫妻位"，可摆一对陶瓷或玉石摆件，象征"稳稳的幸福"；忌放尖角物、仙人掌。',
    items: '入门处可摆一盆阔叶绿植（如绿萝、万年青），吸纳生气；卧室床头柜上避免摆放过多家电，磁场过杂影响睡眠质量。',
  };
}

// ============================================================
// 辅助：天干性格描述（与 education 复用）
// ============================================================
function tianGanTrait(stem: string): string {
  const map: Record<string, string> = {
    甲: '参天之木，性格刚直，有担当',
    乙: '花草之木，柔韧坚韧，善适应',
    丙: '太阳之火，光明磊落，热情大方',
    丁: '灯烛之火，温暖细腻，洞察力强',
    戊: '高山之土，厚重沉稳，可信赖',
    己: '田园之土，包容温和，细心周全',
    庚: '刀剑之金，刚毅果断，有魄力',
    辛: '珠玉之金，温润内敛，重品质',
    壬: '江河之水，灵活善变，思维活跃',
    癸: '雨露之水，细腻敏感，悟性极高',
  };
  return map[stem] || '性格独特';
}
