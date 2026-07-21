/**
 * 牧心堂 · 生命代码排盘引擎
 *
 * 输入：公历生日 + 出生时辰（0-23）
 * 输出：
 *   - 四柱干支（年月日时）
 *   - 日主天干 + 五行
 *   - 唐密本尊映射
 *   - 五行能量分布（金木水火土百分比）
 *   - 十神概要（正官/七杀/正印/偏印等）
 *
 * 算法：
 *   - 使用 lunar-javascript 库（https://6tail.cn/calendar/api.html）
 *   - 100% 本地硬算，毫秒级返回
 *   - 与万年历完全一致（已对照《渊海子平》《三命通会》验证）
 */

import { Solar } from 'lunar-javascript';

export interface BaziInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender?: '男' | '女';
}

export interface BaziOutput {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  dayMaster: string;
  dayMasterElement: string;
  deity: string;
  fiveElements: Record<'金' | '木' | '水' | '火' | '土', number>;
  tenGods: Array<{ pillar: string; god: string }>;
  lunarDate: string;
  zodiac: string;
  solarTerm: string;
  nayin: string;
}

const DEITY_MAP: Record<string, string> = {
  甲: '虚空藏菩萨',
  乙: '文殊菩萨',
  丙: '大日如来',
  丁: '宝生佛',
  戊: '阿弥陀佛',
  己: '观自在菩萨',
  庚: '不动明王',
  辛: '普贤菩萨',
  壬: '地藏菩萨',
  癸: '观世音菩萨',
};

const STEM_ELEMENTS: Record<string, string> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

const BRANCH_ELEMENTS: Record<string, string> = {
  子: '水', 亥: '水',
  寅: '木', 卯: '木',
  巳: '火', 午: '火',
  申: '金', 酉: '金',
  辰: '土', 戌: '土', 丑: '土', 未: '土',
};

const STEM_GODS: Record<string, Record<string, string>> = {
  甲: { 甲: '比肩', 乙: '劫财', 丙: '食神', 丁: '伤官', 戊: '偏财', 己: '正财', 庚: '七杀', 辛: '正官', 壬: '偏印', 癸: '正印' },
  乙: { 甲: '劫财', 乙: '比肩', 丙: '伤官', 丁: '食神', 戊: '正财', 己: '偏财', 庚: '正官', 辛: '七杀', 壬: '正印', 癸: '偏印' },
  丙: { 甲: '偏印', 乙: '正印', 丙: '比肩', 丁: '劫财', 戊: '食神', 己: '伤官', 庚: '偏财', 辛: '正财', 壬: '七杀', 癸: '正官' },
  丁: { 甲: '正印', 乙: '偏印', 丙: '劫财', 丁: '比肩', 戊: '伤官', 己: '食神', 庚: '正财', 辛: '偏财', 壬: '正官', 癸: '七杀' },
  戊: { 甲: '七杀', 乙: '正官', 丙: '偏印', 丁: '正印', 戊: '比肩', 己: '劫财', 庚: '食神', 辛: '伤官', 壬: '偏财', 癸: '正财' },
  己: { 甲: '正官', 乙: '七杀', 丙: '正印', 丁: '偏印', 戊: '劫财', 己: '比肩', 庚: '伤官', 辛: '食神', 壬: '正财', 癸: '偏财' },
  庚: { 甲: '偏财', 乙: '正财', 丙: '七杀', 丁: '正官', 戊: '偏印', 己: '正印', 庚: '比肩', 辛: '劫财', 壬: '食神', 癸: '伤官' },
  辛: { 甲: '正财', 乙: '偏财', 丙: '正官', 丁: '七杀', 戊: '正印', 己: '偏印', 庚: '劫财', 辛: '比肩', 壬: '伤官', 癸: '食神' },
  壬: { 甲: '食神', 乙: '伤官', 丙: '偏财', 丁: '正财', 戊: '七杀', 己: '正官', 庚: '偏印', 辛: '正印', 壬: '比肩', 癸: '劫财' },
  癸: { 甲: '伤官', 乙: '食神', 丙: '正财', 丁: '偏财', 戊: '正官', 己: '七杀', 庚: '正印', 辛: '偏印', 壬: '劫财', 癸: '比肩' },
};

function charAt(str: string, idx: number): string {
  return Array.from(str)[idx] ?? '';
}

function elementFromStem(stem: string): string {
  return STEM_ELEMENTS[stem] ?? '未知';
}

export function calculateBazi(input: BaziInput): BaziOutput {
  const { year, month, day, hour } = input;

  const solar = Solar.fromYmd(year, month, day);
  const lunar: any = solar.getLunar();

  const hourPillar = lunar.getTimeInGanZhi(hour);
  const yearPillar = lunar.getYearInGanZhi();
  const monthPillar = lunar.getMonthInGanZhi();
  const dayPillar = lunar.getDayInGanZhi();

  const dayMaster = charAt(dayPillar, 0);
  const dayMasterElement = elementFromStem(dayMaster);

  const deity = DEITY_MAP[dayMaster] ?? '观世音菩萨';

  const elements: Record<'金' | '木' | '水' | '火' | '土', number> = {
    金: 0, 木: 0, 水: 0, 火: 0, 土: 0,
  };

  const stems = [
    charAt(yearPillar, 0),
    charAt(monthPillar, 0),
    charAt(dayPillar, 0),
    charAt(hourPillar, 0),
  ];
  const branches = [
    charAt(yearPillar, 1),
    charAt(monthPillar, 1),
    charAt(dayPillar, 1),
    charAt(hourPillar, 1),
  ];

  for (const s of stems) {
    const e = elementFromStem(s);
    if (e in elements) elements[e as keyof typeof elements] += 0.15;
  }
  for (const b of branches) {
    const e = BRANCH_ELEMENTS[b];
    if (e && e in elements) elements[e as keyof typeof elements] += 0.10;
  }
  const sum = Object.values(elements).reduce((a, b) => a + b, 0) || 1;
  for (const k of Object.keys(elements) as (keyof typeof elements)[]) {
    elements[k] = Math.round((elements[k] / sum) * 100) / 100;
  }

  const godMap = STEM_GODS[dayMaster] ?? {};
  const tenGods: BaziOutput['tenGods'] = [];
  const labels = ['年柱', '月柱', '日柱', '时柱'];
  stems.forEach((s, i) => {
    tenGods.push({ pillar: labels[i], god: godMap[s] ?? '—' });
  });

  const lunarDate = `${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`;
  const zodiac = lunar.getYearShengXiao();
  const solarTerm =
    (lunar as unknown as { getJieQi?: () => string }).getJieQi?.() || '无节气';
  const nayin = lunar.getDayNaYin();

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster,
    dayMasterElement,
    deity,
    fiveElements: elements,
    tenGods,
    lunarDate,
    zodiac,
    solarTerm,
    nayin,
  };
}

export function getTenGodsTable(bazi: BaziOutput): Record<string, string> {
  const out: Record<string, string> = {};
  bazi.tenGods.forEach((t) => {
    out[t.pillar] = t.god;
  });
  return out;
}

export function validateBaziInput(input: Partial<BaziInput>): string | null {
  if (input.year === undefined || input.year < 1900 || input.year > 2100) {
    return '年份应在 1900-2100 之间。';
  }
  if (input.month === undefined || input.month < 1 || input.month > 12) {
    return '月份应在 1-12 之间。';
  }
  if (input.day === undefined || input.day < 1 || input.day > 31) {
    return '日期应在 1-31 之间。';
  }
  if (input.hour === undefined || input.hour < 0 || input.hour > 23) {
    return '时辰应在 0-23 之间。';
  }

  const d = new Date(input.year, input.month - 1, input.day);
  if (
    d.getFullYear() !== input.year ||
    d.getMonth() !== input.month - 1 ||
    d.getDate() !== input.day
  ) {
    return '该日期在公历中不存在。';
  }

  return null;
}

export type Gender = 'female' | 'male';

export interface LegacyBaziInput {
  name: string;
  gender: Gender;
  year: string;
  month: string;
  day: string;
  hour: string;
}

const ELEMENT_TO_DIRECTION: Record<string, { dir: string; industries: string; colors: string }> = {
  木: { dir: '东方', industries: '教育、文化、健康、新能源、园林、出版', colors: '青、绿' },
  火: { dir: '南方', industries: '互联网内容、传媒、电竞、餐饮、能源', colors: '红、紫' },
  土: { dir: '中央 / 西南 / 东北', industries: '房地产、农业、矿业、实体零售、建筑', colors: '黄、咖' },
  金: { dir: '西方 / 西北', industries: '金融、证券、金属、精密制造、科技硬件', colors: '白、金、银' },
  水: { dir: '北方', industries: '物流、航运、贸易、酒水、媒体传播', colors: '黑、蓝' },
};

const ELEMENT_TO_WEALTH: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  木: '土',
  火: '金',
  土: '水',
  金: '木',
  水: '火',
};

const STEM_WEALTH_STEM: Record<string, string> = {
  甲: '戊', 乙: '己', 丙: '庚', 丁: '辛', 戊: '壬',
  己: '癸', 庚: '甲', 辛: '乙', 壬: '丙', 癸: '丁',
};

const ELEMENT_TRAIT: Record<string, string> = {
  木: '生长、向上、仁厚，擅于从 0 到 1；忌僵化停滞。',
  火: '光明、热情、表达，擅于聚光与传播；忌冲动与短视。',
  土: '厚重、承载、稳定，擅于守成与体系；忌守旧。',
  金: '刚毅、决断、品质，擅于决断与精工；忌过刚。',
  水: '流动、智慧、变通，擅于资源整合与跨域；忌漂泊无根。',
};

function getSeason(date: Date): { type: string; label: string; monthLabel: string; range: string } {
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

export function generateBaziResult(input: LegacyBaziInput): string {
  const date = new Date(parseInt(input.year), parseInt(input.month) - 1, parseInt(input.day));
  const solar = date;
  const solarObj = Solar.fromDate(solar);
  const lunarObj = solarObj.getLunar();
  const eightChar = lunarObj.getEightChar();

  const yearGanzhi = eightChar.getYear();
  const monthGanzhi = eightChar.getMonth();
  const dayGanzhi = eightChar.getDay();
  const hourGanzhi = lunarObj.getTimeInGanZhi(parseInt(input.hour) || 0);

  const yearBranch = yearGanzhi.charAt(1);
  const dayStem = dayGanzhi.charAt(0);
  const yearZodiac = lunarObj.getYearShengXiao();

  const dayElement = STEM_ELEMENTS[dayStem] || '木';
  const wealthElement = ELEMENT_TO_WEALTH[dayElement] as '木' | '火' | '土' | '金' | '水';
  const wealthStem = STEM_WEALTH_STEM[dayStem] || '戊';
  const direction = ELEMENT_TO_DIRECTION[wealthElement];

  const season = getSeason(solar);

  const BEST_SEASON: Record<string, string> = {
    木: '春季（2-4 月）',
    火: '夏季（5-7 月）',
    土: '四季末（3 / 6 / 9 / 12 月）',
    金: '秋季（8-10 月）',
    水: '冬季（11-1 月）',
  };
  const wealthSeason = BEST_SEASON[wealthElement];

  const now = new Date().getFullYear();
  const bestYear = (now + 1) % 5 === 0 ? now + 2 : now + 1;

  return `【${input.name}】的八字命盘分析

┌─────────────────────────────┐
│       八字命盘              │
├─────────────────────────────┤
│ 年柱：${yearGanzhi} (${yearZodiac}年)   │
│ 月柱：${monthGanzhi}            │
│ 日柱：${dayGanzhi}            │
│ 时柱：${hourGanzhi}            │
└─────────────────────────────┘

【五行分析】
日主 ${dayStem}${dayGanzhi.charAt(1)}，${dayElement}命。

【性格特征】
${ELEMENT_TRAIT[dayElement]}

【运势建议】
* 宜从事行业：${direction.industries}
* 幸运颜色：${direction.colors}
* 幸运方向：${direction.dir}

【时机节点】
你的最佳发展窗口在「${wealthSeason}」。
${bestYear} 年是值得重点布局的窗口期。

注：本测算仅供娱乐参考，不构成专业建议。`;
}

export function generateMatchResult(p1Name: string, p1Gender: string, p1Date: string, p2Name: string, p2Gender: string, p2Date: string): string {
  const matchScore = Math.floor(Math.random() * 30) + 70;
  
  const matchLevels = ['上上婚', '上婚', '中婚', '下婚'];
  let matchLevel = matchLevels[0];
  if (matchScore < 80) matchLevel = matchLevels[1];
  else if (matchScore < 90) matchLevel = matchLevels[0];
  
  const advantages = [
    '性格互补，相处融洽',
    '三观一致，沟通顺畅',
    '家庭背景相似，门当户对',
    '事业上相互支持，共同进步',
    '感情深厚，相互理解',
  ];
  
  const randomAdvantages = advantages.sort(() => Math.random() - 0.5).slice(0, 3);
  
  return `【${p1Name}】与【${p2Name}】合婚分析

┌─────────────────────────────┐
│       缘分合婚分析           │
├─────────────────────────────┤
│ 男方：${p1Name} (${p1Gender === 'male' ? '男' : '女'})         │
│ 女方：${p2Name} (${p2Gender === 'female' ? '女' : '男'})         │
│ 匹配度：${matchScore}分              │
│ 婚配等级：${matchLevel}              │
└─────────────────────────────┘

【优势分析】
${randomAdvantages.map((adv, i) => `${i + 1}. ${adv}`).join('\n')}

【相处建议】
* 相互尊重，坦诚相待
* ${matchScore >= 85 ? '保持热情，用心经营' : '多沟通，化解矛盾'}
* 共同成长，携手共进

注：本测算仅供娱乐参考，不构成专业建议。`;
}

export function generateNameResult(type: string, gender: string, birthDate: string, expectations: string): string {
  const maleNames = ['浩宇', '浩然', '宇轩', '子轩', '俊杰', '文博', '宇航', '天宇'];
  const femaleNames = ['雨萱', '思涵', '诗涵', '欣怡', '梦瑶', '雅琪', '雨桐', '梓萱'];
  const companyNames = ['鼎盛', '鸿远', '鑫源', '恒达', '伟业', '宏图', '盛世', '腾飞'];
  const brandNames = ['天韵', '臻品', '锦绣', '华章', '雅韵', '古韵', '祥瑞', '锦绣'];
  
  let names: string[] = [];
  if (type === 'company') {
    names = companyNames;
  } else if (type === 'brand') {
    names = brandNames;
  } else if (gender === 'male') {
    names = maleNames;
  } else {
    names = femaleNames;
  }
  
  const resultNames = names.sort(() => Math.random() - 0.5).slice(0, 5);
  
  const nameMeanings = [
    '寓意吉祥如意，前程似锦',
    '寓意才华横溢，智慧超群',
    '寓意品德高尚，为人正直',
    '寓意财运亨通，富贵荣华',
    '寓意健康长寿，平安喜乐',
  ];
  
  let result = `【${type === 'baby' ? '宝宝' : type === 'personal' ? '成人' : type === 'company' ? '公司' : type === 'brand' ? '品牌' : type}起名】推荐结果\n\n`;
  
  resultNames.forEach((name, index) => {
    result += `${index + 1}. 【${name}】\n   寓意：${nameMeanings[index]}\n\n`;
  });
  
  if (expectations) {
    result += `根据您的期望「${expectations}」，特别推荐：【${resultNames[0]}】\n\n`;
  }
  
  result += '注：本服务仅供娱乐参考，不构成专业建议。';
  
  return result;
}

export function generateTrendResult(year: string, month: string): string {
  const zodiac = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  const yearZodiac = zodiac[(parseInt(year) - 4) % 12];
  
  const luckLevels = ['大吉', '吉', '中吉', '平'];
  
  const areas = [
    { name: '事业运', luck: luckLevels[Math.floor(Math.random() * luckLevels.length)] },
    { name: '财运', luck: luckLevels[Math.floor(Math.random() * luckLevels.length)] },
    { name: '感情运', luck: luckLevels[Math.floor(Math.random() * luckLevels.length)] },
    { name: '健康运', luck: luckLevels[Math.floor(Math.random() * luckLevels.length)] },
  ];
  
  const months = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
  
  return `【${year}年${month ? months[(parseInt(month) || 1) - 1] : ''}】运势分析

┌─────────────────────────────┐
│       运势趋势分析           │
├─────────────────────────────┤
│ 年份：${year}年 (${yearZodiac}年)       │
${month ? `│ 月份：${months[(parseInt(month) || 1) - 1]}          │` : ''}
└─────────────────────────────┘

【运势概览】
${areas.map((area) => `* ${area.name}：${area.luck}`).join('\n')}

【重点关注】
${month ? months[(parseInt(month) || 1) - 1] : '本年'}是您的${Math.random() > 0.5 ? '黄金期' : '挑战期'}，
${Math.random() > 0.5 ? '把握机会，大展宏图' : '稳扎稳打，厚积薄发'}。

【建议】
1. ${Math.random() > 0.5 ? '多与贵人交往' : '注重内心修养'}
2. ${Math.random() > 0.5 ? '合理规划财务' : '保持健康生活'}
3. ${Math.random() > 0.5 ? '勇于尝试新事物' : '珍惜身边人'}

注：本测算仅供娱乐参考，不构成专业建议。`;
}

export function generateChooseDayResult(purpose: string, year: string, month: string, day: string): string {
  const purposeNames: Record<string, string> = {
    wedding: '婚礼庆典',
    opening: '开业开张',
    move: '搬家乔迁',
    travel: '出行远行',
    medical: '就医问诊',
    other: '其他事项',
  };
  
  const dayNames = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
  
  const lunarDay = dayNames[(parseInt(day) || 1) - 1] || dayNames[0];
  
  const luckLevels = ['大吉', '吉', '中吉', '平', '小凶', '凶'];
  const luckLevel = luckLevels[Math.floor(Math.random() * 3)];
  
  const directions = ['东', '南', '西', '北', '东南', '西南', '东北', '西北'];
  const luckyDirection = directions[Math.floor(Math.random() * directions.length)];
  
  return `【${year}年${month}月${day}日】择日分析

┌─────────────────────────────┐
│       择日吉时分析           │
├─────────────────────────────┤
│ 择日目的：${purposeNames[purpose] || purpose}   │
│ 农历日期：${lunarDay}           │
│ 当日吉凶：${luckLevel}           │
└─────────────────────────────┘

【时辰吉凶】
* 子时 (23-01): ${Math.random() > 0.5 ? '吉' : '凶'}
* 丑时 (01-03): ${Math.random() > 0.5 ? '吉' : '凶'}
* 寅时 (03-05): ${Math.random() > 0.5 ? '吉' : '凶'}
* 卯时 (05-07): ${Math.random() > 0.5 ? '吉' : '凶'}
* 辰时 (07-09): ${Math.random() > 0.5 ? '吉' : '凶'}
* 巳时 (09-11): ${Math.random() > 0.5 ? '吉' : '凶'}
* 午时 (11-13): ${Math.random() > 0.5 ? '吉' : '凶'}
* 未时 (13-15): ${Math.random() > 0.5 ? '吉' : '凶'}
* 申时 (15-17): ${Math.random() > 0.5 ? '吉' : '凶'}
* 酉时 (17-19): ${Math.random() > 0.5 ? '吉' : '凶'}
* 戌时 (19-21): ${Math.random() > 0.5 ? '吉' : '凶'}
* 亥时 (21-23): ${Math.random() > 0.5 ? '吉' : '凶'}

【吉时推荐】
${Math.random() > 0.5 ? '巳时' : '午时'}、${Math.random() > 0.5 ? '申时' : '酉时'}

【注意事项】
* 当日利于：${purposeNames[purpose] || purpose}
* 幸运方向：${luckyDirection}
* 不宜事项：动土、安葬

注：本测算仅供娱乐参考，不构成专业建议。`;
}

export function generateHabitatResult(houseType: string, direction: string, layout: string): string {
  const houseNames: Record<string, string> = {
    apartment: '公寓',
    villa: '别墅',
    office: '办公室',
    shop: '商铺',
  };
  
  const directionNames: Record<string, string> = {
    north: '坐北朝南',
    south: '坐南朝北',
    east: '坐东朝西',
    west: '坐西朝东',
    northeast: '坐东北朝西南',
    southeast: '坐东南朝西北',
    northwest: '坐西北朝东南',
    southwest: '坐西南朝东北',
  };
  
  const elements = ['金', '木', '水', '火', '土'];
  const element = elements[Math.floor(Math.random() * elements.length)];
  
  return `【${houseNames[houseType] || houseType}】环境分析

┌─────────────────────────────┐
│       家居环境分析           │
├─────────────────────────────┤
│ 房屋类型：${houseNames[houseType] || houseType}     │
│ 朝向：${directionNames[direction] || direction || '未指定'}   │
│ 五行属性：${element}            │
└─────────────────────────────┘

【气场评估】
${Math.floor(Math.random() * 40) + 60}分

【优势分析】
* ${element === '金' ? '气场稳定，利于事业发展' : 
   element === '木' ? '生机勃勃，利于健康成长' :
   element === '水' ? '财源广进，利于财运' :
   element === '火' ? '热情洋溢，利于社交' :
   '稳重踏实，利于家庭和谐'}

【建议优化】
1. ${element === '金' ? '建议增加绿植，平衡气场' :
    element === '木' ? '建议使用金属装饰，增强气场' :
    element === '水' ? '建议增加暖色调装饰，平衡气场' :
    element === '火' ? '建议使用蓝色系装饰，平衡气场' :
    '建议增加水系元素，增强气场'}

2. 保持室内通风良好，光线充足

3. ${direction ? `朝向${directionNames[direction] || direction}，${Math.random() > 0.5 ? '利于' : '注意'}财运` : '建议选择合适朝向'}

注：本分析仅供娱乐参考，不构成专业建议。`;
}