// ============================================================
// wealth-rules.ts —— 事业智富 · 破局之道
// 输入：用户八字 + 职业
// 输出：基于日干→财星五行的方向 / 进攻/稳健类型 / 旺衰节点
// 与 WealthPageClient.WealthReport 完全对齐
// ============================================================

import { Solar } from 'lunar-javascript';

export type Career =
  | '互联网'
  | '金融'
  | '制造'
  | '教育'
  | '服务业'
  | '自由职业'
  | '其他';

export type Gender = 'female' | 'male';

export interface WealthInput {
  name: string;
  gender: Gender;
  birthDate: string;       // YYYY-MM-DD
  birthHour: number;       // 0-23
  calendarType: 'solar' | 'lunar';
  career: Career;
}

// ---------- 五行基础数据 ----------
const STEM_TO_ELEMENT: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

const ELEMENT_TO_DIRECTION: Record<string, { dir: string; industries: string; colors: string }> = {
  木: { dir: '东方', industries: '教育、文化、健康、新能源、园林、出版', colors: '青、绿' },
  火: { dir: '南方', industries: '互联网内容、传媒、电竞、餐饮、能源', colors: '红、紫' },
  土: { dir: '中央 / 西南 / 东北', industries: '房地产、农业、矿业、实体零售、建筑', colors: '黄、咖' },
  金: { dir: '西方 / 西北', industries: '金融、证券、金属、精密制造、科技硬件', colors: '白、金、银' },
  水: { dir: '北方', industries: '物流、航运、贸易、酒水、媒体传播', colors: '黑、蓝' },
};

// 我克者为财：日干 → 所克元素
const ELEMENT_TO_WEALTH: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  木: '土',
  火: '金',
  土: '水',
  金: '木',
  水: '火',
};

// 简表：日干 → 财星（取"同性"的天干，阴阳同论）
const STEM_WEALTH_STEM: Record<string, string> = {
  甲: '戊', 乙: '己', 丙: '庚', 丁: '辛', 戊: '壬',
  己: '癸', 庚: '甲', 辛: '乙', 壬: '丙', 癸: '丁',
};

// 生我者（印星）—— 用于"宜守宜攻"判断
const SHENG_FOR: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  木: '水', 火: '木', 土: '火', 金: '土', 水: '金',
};

// 年支 → 性格冲劲（进攻/稳健）
const BRANCH_TENDENCY: Record<string, '进攻型' | '稳健型' | '创意型' | '谋略型'> = {
  子: '谋略型', 亥: '谋略型', 午: '进攻型', 巳: '进攻型',
  寅: '进攻型', 卯: '创意型',
  申: '谋略型', 酉: '稳健型',
  辰: '稳健型', 戌: '稳健型',
  丑: '稳健型', 未: '稳健型',
};

// 季节 + 五行
function getSeason(date: Date): { type: 'water' | 'wood' | 'fire' | 'metal'; label: string; monthLabel: string; range: string } {
  const m = date.getMonth() + 1;
  const day = date.getDate();
  if ((m === 11 && day >= 7) || m === 12 || m === 1 || (m === 2 && day < 4)) {
    return { type: 'water', label: '水旺 · 冬藏蓄势', monthLabel: '冬', range: '11月7日 ~ 2月3日' };
  }
  if ((m === 2 && day >= 4) || m === 3 || m === 4 || (m === 5 && day < 5)) {
    return { type: 'wood', label: '木旺 · 春生发越', monthLabel: '春', range: '2月4日 ~ 5月4日' };
  }
  if ((m === 5 && day >= 5) || m === 6 || m === 7 || (m === 8 && day < 7)) {
    return { type: 'fire', label: '火旺 · 夏长繁茂', monthLabel: '夏', range: '5月5日 ~ 8月6日' };
  }
  return { type: 'metal', label: '金旺 · 秋收肃敛', monthLabel: '秋', range: '8月7日 ~ 11月6日' };
}

// 同业比和 → 旺；生我 → 相；克我 → 死；我生 → 休；我克 → 囚
function getPhase(dayElement: string, seasonType: string): { phase: string; tone: string; verdict: string } {
  if (dayElement === seasonType) {
    return { phase: '旺', tone: '顺势而为，势能充沛', verdict: '适宜主动出击、扩张、谈大单' };
  }
  // 我生 = 休；克我 = 死；生我 = 相；我克 = 囚
  const phaseMap: Record<string, Record<string, string>> = {
    木: { fire: '休', water: '相', metal: '死', earth: '囚' },
    火: { earth: '休', wood: '相', water: '死', metal: '囚' },
    土: { metal: '休', fire: '相', wood: '死', water: '囚' },
    金: { water: '休', earth: '相', fire: '死', wood: '囚' },
    水: { wood: '休', metal: '相', earth: '死', fire: '囚' },
  };
  const phase = phaseMap[dayElement]?.[seasonType] || '中';
  const toneMap: Record<string, string> = {
    休: '精力外放，宜向外输出、见客户、做内容',
    相: '贵人相助，宜借势、谈合作、找引路人',
    死: '压力较大，宜守不宜攻，谨慎扩张',
    囚: '能量内收，宜学习、复盘、蓄力',
  };
  return {
    phase,
    tone: toneMap[phase] || '平稳期，按既有节奏推进',
    verdict: phase === '死' || phase === '囚' ? '建议稳健为主，避免重大投资决策' : '可稳步推进，重大决策需结合具体大运',
  };
}

// ---- 职业 × 财星五行 → 匹配度（0-1）----
function careerMatchScore(career: Career, wealthElement: '木' | '火' | '土' | '金' | '水'): number {
  // 大类：互联网/金融/制造/教育/服务业/自由职业/其他
  const map: Record<Career, Record<string, number>> = {
    互联网:    { 火: 1.0, 金: 0.7, 水: 0.7, 木: 0.5, 土: 0.3 },
    金融:      { 金: 1.0, 水: 0.8, 土: 0.6, 木: 0.4, 火: 0.3 },
    制造:      { 金: 0.9, 土: 0.9, 木: 0.6, 水: 0.4, 火: 0.4 },
    教育:      { 木: 1.0, 水: 0.7, 火: 0.6, 土: 0.5, 金: 0.3 },
    服务业:    { 火: 0.8, 水: 0.7, 木: 0.7, 土: 0.6, 金: 0.5 },
    自由职业:  { 木: 0.9, 火: 0.8, 水: 0.8, 金: 0.5, 土: 0.4 },
    其他:      { 土: 0.6, 金: 0.6, 水: 0.6, 火: 0.6, 木: 0.6 },
  };
  return map[career][wealthElement];
}

// ---- 职业建议 ----
const CAREER_TIPS: Record<Career, string> = {
  互联网: '深耕主业的同时关注 AI 上下游、AI+行业 应用，关注产品-市场契合度（PMF）。',
  金融: '守纪律比追热点更重要。远离杠杆，配股债 + 现金 + 海外资产。',
  制造: '现金流是命，库存是天敌。优先做精益化再谈规模化。',
  教育: '把"个人IP"做厚 —— 口碑与作品集比头衔更值钱。',
  服务业: '客户复购率 > 拉新。打造 SOP，把"个人能力"变成"组织能力"。',
  自由职业: '把技能产品化、课程化、自动化。警惕"用时间换钱"的陷阱。',
  其他: '可参考财星方向微调业务重心，或考虑副业延伸。',
};

// ---- 五行性格 ----
const ELEMENT_TRAIT: Record<string, string> = {
  木: '生长、向上、仁厚，擅于从 0 到 1；忌僵化停滞。',
  火: '光明、热情、表达，擅于聚光与传播；忌冲动与短视。',
  土: '厚重、承载、稳定，擅于守成与体系；忌守旧。',
  金: '刚毅、决断、品质，擅于决断与精工；忌过刚。',
  水: '流动、智慧、变通，擅于资源整合与跨域；忌漂泊无根。',
};

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function formatSolar(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function buildSolarFromInput(input: WealthInput): Date {
  if (input.calendarType === 'solar') {
    return new Date(input.birthDate);
  }
  // 农历：lunar-javascript 提供 Lunar.fromYmd
  const { Lunar } = require('lunar-javascript') as typeof import('lunar-javascript');
  const [y, m, d] = input.birthDate.split('-').map(Number);
  const lunar = Lunar.fromYmd(y, m, d);
  const solar = lunar.getSolar();
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
}

// ---- 旺衰评分（职业匹配 50% + 季节相位 30% + 五行配合 20%）----
function computeScore(careerMatch: number, phase: string, dayElement: string, wealthElement: string): number {
  const careerPart = Math.round(careerMatch * 50);
  const phaseMap: Record<string, number> = { 旺: 30, 相: 26, 休: 22, 囚: 16, 死: 12 };
  const phasePart = phaseMap[phase] ?? 20;
  // 五行生克：财星生日干 +10；日干生财星 +6；克财星 +0；财星克日干 -5
  let wuxingPart = 0;
  if (SHENG_FOR[wealthElement] === dayElement) wuxingPart = 18;        // 财生我
  else if (dayElement === ELEMENT_TO_WEALTH[dayElement] && wealthElement === dayElement) wuxingPart = 0; // 不会发生
  else if (ELEMENT_TO_WEALTH[dayElement] === wealthElement) wuxingPart = 16;  // 我克 = 财
  else wuxingPart = 10;
  return Math.min(100, careerPart + phasePart + wuxingPart);
}

export interface WealthReport {
  input: {
    name: string;
    gender: Gender;
    birthDate: string;
    calendarType: 'solar' | 'lunar';
    career: Career;
  };
  bazi: {
    yearGanzhi: string;
    monthGanzhi: string;
    dayGanzhi: string;
    yearZodiac: string;
    yearBranch: string;
    dayStem: string;
    dayElement: string;
    solarDate: string;
    lunarDate: string;
  };
  wealthSource: {
    element: '木' | '火' | '土' | '金' | '水';
    wealthStem: string;
    direction: string;
    industries: string;
    colors: string;
    trait: string;
  };
  careerType: {
    type: '进攻型' | '稳健型' | '创意型' | '谋略型';
    strength: string;
    workMode: '打工' | '创业' | '合伙' | '自由';
    workModeReason: string;
  };
  timing: {
    season: { type: 'water' | 'wood' | 'fire' | 'metal'; label: string; monthLabel: string; range: string };
    phase: string;          // 旺/相/休/囚/死
    tone: string;
    verdict: string;
    bestSeason: string;     // 五行喜用映射到四季
    bestYear: number;
  };
  career: {
    label: Career;
    match: number;          // 0-1
    matchLabel: string;     // 极佳/较佳/中等/偏弱
    tip: string;
  };
  free: {
    origin: { title: string; content: string; source: string };
    fangxiang: { title: string; content: string };
    gongzhan: { title: string; content: string };
    shijian: { title: string; content: string };
    yishi: { title: string; content: string };  // 哲理
  };
  paid: {
    qushi: { title: string; content: string };        // 未来 3 年流年
    jiating: { title: string; content: string };      // 家庭财富池
    guanli: { title: string; content: string };       // 管理用人
    fangkeng: { title: string; content: string };     // 防坑指南
    zhidao: { title: string; content: string };       // 3 步落地
  };
  score: number;
}

export function checkWealthRules(input: WealthInput): WealthReport {
  const solar = buildSolarFromInput(input);
  const solarObj = Solar.fromDate(solar);
  const lunarObj = solarObj.getLunar();
  const eightChar = lunarObj.getEightChar();

  const yearGanzhi = eightChar.getYear();
  const monthGanzhi = eightChar.getMonth();
  const dayGanzhi = eightChar.getDay();
  const yearBranch = yearGanzhi.charAt(1);
  const dayStem = dayGanzhi.charAt(0);
  const yearZodiac = lunarObj.getYearShengXiao();

  const dayElement = STEM_TO_ELEMENT[dayStem] || '木';
  const wealthElement = ELEMENT_TO_WEALTH[dayElement] as '木' | '火' | '土' | '金' | '水';
  const wealthStem = STEM_WEALTH_STEM[dayStem] || '戊';
  const direction = ELEMENT_TO_DIRECTION[wealthElement];

  const season = getSeason(solar);
  const phase = getPhase(dayElement, season.type);

  const tendency = BRANCH_TENDENCY[yearBranch] || '稳健型';
  const careerType: '进攻型' | '稳健型' | '创意型' | '谋略型' = tendency;

  const careerMatch = careerMatchScore(input.career, wealthElement);
  const matchLabel = careerMatch >= 0.85 ? '极佳匹配' : careerMatch >= 0.7 ? '较佳匹配' : careerMatch >= 0.5 ? '中等等位' : '需要微调';
  const match = Number(careerMatch.toFixed(2));

  const score = computeScore(careerMatch, phase.phase, dayElement, wealthElement);

  // 最佳季节：日干喜用 = 我克（财）或生我（印）
  const BEST_SEASON: Record<string, string> = {
    木: '春季（2-4 月）',
    火: '夏季（5-7 月）',
    土: '四季末（3 / 6 / 9 / 12 月）',
    金: '秋季（8-10 月）',
    水: '冬季（11-1 月）',
  };
  // 财星对应的最佳季节
  const wealthSeason = BEST_SEASON[wealthElement];

  const now = new Date().getFullYear();
  // 简化：明年 / 后年哪一年五行与财星合
  const bestYear = (now + 1) % 5 === 0 ? now + 2 : now + 1;

  // 打工 / 创业 / 合伙 / 自由
  let workMode: '打工' | '创业' | '合伙' | '自由';
  let workModeReason: string;
  if (careerType === '进攻型' && (input.career === '互联网' || input.career === '自由职业')) {
    workMode = '创业';
    workModeReason = '进攻型命格 + 高弹性行业，最宜独立开拓或小团队创业。';
  } else if (careerType === '谋略型' && (input.career === '金融' || input.career === '教育')) {
    workMode = '合伙';
    workModeReason = '谋略型 + 资源密集行业，最宜在大型平台里找合伙人、谋大局。';
  } else if (input.career === '自由职业') {
    workMode = '自由';
    workModeReason = '你已经具备"自由职业"标签，专注产品化 / 课程化 / 自动化即可。';
  } else {
    workMode = '打工';
    workModeReason = '当前组合适合深耕平台 / 体系，借势成长比贸然创业更稳。';
  }

  const solarDate = formatSolar(solar);
  const lunarDate = `${lunarObj.getYearInChinese()}年${lunarObj.getMonthInChinese()}月${lunarObj.getDayInChinese()}`;

  return {
    input: {
      name: input.name,
      gender: input.gender,
      birthDate: input.birthDate,
      calendarType: input.calendarType,
      career: input.career,
    },
    bazi: {
      yearGanzhi,
      monthGanzhi,
      dayGanzhi,
      yearZodiac,
      yearBranch,
      dayStem,
      dayElement,
      solarDate,
      lunarDate,
    },
    wealthSource: {
      element: wealthElement,
      wealthStem,
      direction: direction.dir,
      industries: direction.industries,
      colors: direction.colors,
      trait: ELEMENT_TRAIT[wealthElement],
    },
    careerType: {
      type: careerType,
      strength: careerType === '进攻型'
        ? '性格主动、敢打敢拼，适合开拓新市场、独立做项目'
        : careerType === '稳健型'
          ? '性格稳重、风险厌恶，适合守成、做深做精一个领域'
          : careerType === '创意型'
            ? '思维活跃、点子多，适合做内容、做品牌、做IP'
            : '善于谋略、善用资源，适合做整合、做平台型业务',
      workMode,
      workModeReason,
    },
    timing: {
      season,
      phase: phase.phase,
      tone: phase.tone,
      verdict: phase.verdict,
      bestSeason: wealthSeason,
      bestYear,
    },
    career: {
      label: input.career,
      match,
      matchLabel,
      tip: CAREER_TIPS[input.career],
    },
    free: {
      origin: {
        title: '📜 命格溯源',
        content: `${input.name}（${solarDate}，${yearZodiac}年），日柱 ${dayGanzhi}（日干 ${dayStem}，属${dayElement}）。${ELEMENT_TRAIT[dayElement]}`,
        source: '《子平真诠》·《滴天髓》',
      },
      fangxiang: {
        title: '🧭 财源方向',
        content: `日干 ${dayStem}，命中以「${wealthElement}」为财（财星天干为 ${wealthStem}）。建议重点关注 ${direction.dir} 区位及关联产业：${direction.industries}。日常穿搭 / 办公位 / 常用物品可多用 ${direction.colors} 系，强化"财气感应"。`,
      },
      gongzhan: {
        title: '⚔️ 谋财方式',
        content: `年支 ${yearBranch}，属${careerType}——${careerType === '进攻型' ? '主动出击型' : careerType === '稳健型' ? '稳健守成型' : careerType === '创意型' ? '创意点子型' : '谋略整合型'}。${phase.phase === '旺' ? '当前时令与命格同频，可大胆尝试新业务/新岗位' : phase.phase === '相' ? '当前时令生扶命格，宜借势、寻引路人' : phase.phase === '休' ? '当前精力外放期，宜见客户、做内容' : phase.phase === '囚' ? '当前能量内收期，宜学习、复盘、蓄力' : '当前压力较大，宜守不宜攻，谨慎扩张'}。`,
      },
      shijian: {
        title: '🕰️ 时机节点',
        content: `你的最佳发展窗口在「${wealthSeason}」，对应方位 ${direction.dir}。${bestYear} 年是值得重点布局的窗口期（流年与财星相合），可考虑启动新项目、谈股权、调岗。`,
      },
      yishi: {
        title: '🍵 智富小语',
        content: '君子爱财，取之有道 —— 与其追逐风口，不如把自己活成"风口想请的人"。',
      },
    },
    paid: {
      qushi: {
        title: '📈 未来 3 年财富走势',
        content: `${now + 1}年：流年与财星 ${wealthElement} ${phase.phase === '旺' || phase.phase === '相' ? '相合' : '相克'}，${phase.phase === '旺' || phase.phase === '相' ? '是正财稳固的窗口，宜加大投入、扩团队' : '宜守为主，谨慎扩张，把现金流和效率放在第一位'}。\n${now + 2}年：转入下个流年，${now + 2 % 5 === 0 ? '是驿马年，迁移/变动反而带来转机' : '稳中有升，宜优化产品结构'}。\n${now + 3}年：${now + 3 % 5 === 0 ? '财星透出，有大单/大客户的机会' : '是深耕精进年，把现有项目做深做透'}。`,
      },
      jiating: {
        title: '🏠 家庭财富池运营',
        content: '配置建议：3-6 个月家庭开支的应急现金 + 一份稳健的固收或储蓄险 + 长期指数基金定投 + 房产控制在家庭资产 50% 以内。\n教育金专项账户（孩子出生开始每月固定 1000-3000 元定投指数基金）。\n家庭年度财务复盘：每年初 1 月做一次 5 个 1 复盘（1 目标 / 1 收入 / 1 支出 / 1 投资 / 1 风险）。',
      },
      guanli: {
        title: '👥 管理与用人',
        content: workMode === '合伙'
          ? '合伙关键：白纸黑字写清楚"分钱规则 + 退出机制"。三人以上合伙最容易死在"和稀泥"。'
          : workMode === '创业'
            ? '小团队别追求"全面人才"，要找"互斥型合伙人"：一个懂产品，一个懂钱/客户，一个懂执行。'
            : workMode === '自由'
              ? '你最大的杠杆是"时间单价"。把 80% 时间投入 20% 高价值客户，每周留 1 天做"战略思考日"。'
              : '职场生存：让你的 boss 成为你的"用户"。一年做出 1-2 件让 boss 愿意在年会上点名的事。',
      },
      fangkeng: {
        title: '🚧 防坑指南',
        content: `结合你的财星「${wealthElement}」与年支「${yearBranch}」，给你 3 条避坑建议：\n1. ${wealthElement === '水' || wealthElement === '火' ? '高收益伴随高杠杆的项目' : '来路不明的"内部消息" / 熟人借贷'} —— 遇到先拒绝，再考虑 24 小时。\n2. ${yearBranch === '子' || yearBranch === '亥' ? '盲目扩张 / 多元化' : yearBranch === '午' || yearBranch === '巳' ? '过度保守 / 错过机会' : yearBranch === '寅' || yearBranch === '卯' ? '频繁换赛道' : '把所有鸡蛋放一个篮子里'} —— 每季度做一次 portfolio review。\n3. ${phase.phase === '死' || phase.phase === '囚' ? '本季不宜做重大投资决策' : '任何让你"必须今晚决定"的机会都不是好机会'}。`,
      },
      zhidao: {
        title: '🎯 3 步落地清单',
        content: '第 1 步（本周内）：列出你当前最重要的 3 个收入来源，分别打 1-10 分（投入产出比 / 复购性 / 心流强度），保留 ≥7 分的，砍掉 ≤4 分的。\n第 2 步（30 天内）：在财星对应方向（' + direction.dir + '）做 1 件事 —— 比如加一个相关行业的人、订阅一份相关行业的研报、约一次相关行业的咖啡。\n第 3 步（90 天内）：在「' + wealthSeason + '」之前启动 1 个新动作（新项目 / 新岗位 / 新业务线），把节奏卡在最佳窗口。',
      },
    },
    score,
  };
}
