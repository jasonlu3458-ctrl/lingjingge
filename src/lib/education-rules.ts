// ============================================================
// education-rules.ts —— 子女学业报告 · 业务规则核验
// 用 lunar-javascript 做八字换算，再根据日干/季节推：
//   文昌、学堂、词馆、华盖、孤辰、寡宿 等星位
//   书桌朝向、文昌用品、饮食等建议
// 报告字段与 EducationPageClient.EducationReport 完全对齐。
// ============================================================

import { Solar, Lunar } from 'lunar-javascript';

export interface EducationInput {
  name: string;
  birthDate: string; // YYYY-MM-DD
  calendarType: 'solar' | 'lunar';
  grade?: string;
}

// 文昌位（地支）查找表 —— 按日干索引
// 传统口诀：甲己酉，乙庚申，丙辛亥，丁壬寅，戊癸巳
const WENCHANG_BRANCH: Record<string, string> = {
  甲: '酉', 己: '酉',
  乙: '申', 庚: '申',
  丙: '亥', 辛: '亥',
  丁: '寅', 壬: '寅',
  戊: '巳', 癸: '巳',
};

// 学堂位（天干）查找表 —— 按日干索引
// 传统口诀：甲己丙，乙庚戊，丙辛丁，丁壬庚，戊癸辛
const XUETANG_STEM: Record<string, string> = {
  甲: '丙', 己: '丙',
  乙: '戊', 庚: '戊',
  丙: '丁', 辛: '丁',
  丁: '庚', 壬: '庚',
  戊: '辛', 癸: '辛',
};

// 词馆位（地支）—— 按日干索引
// 传统口诀：甲己亥，乙庚子，丙辛丑，丁壬寅，戊癸卯
const CIGUAN_BRANCH: Record<string, string> = {
  甲: '亥', 己: '亥',
  乙: '子', 庚: '子',
  丙: '丑', 辛: '丑',
  丁: '寅', 壬: '寅',
  戊: '卯', 癸: '卯',
};

// 华盖位（地支）—— 按年支查（三合局最后一支）
// 寅午戌 → 戌；申子辰 → 辰；亥卯未 → 未；巳酉丑 → 丑
const HUAGAI_BRANCH: Record<string, string> = {
  寅: '戌', 午: '戌', 戌: '戌',
  申: '辰', 子: '辰', 辰: '辰',
  亥: '未', 卯: '未', 未: '未',
  巳: '丑', 酉: '丑', 丑: '丑',
};

// 孤辰寡宿 —— 按年支
// 简化：每个三合局的"孤辰"位
const GUCENG_BRANCH: Record<string, string> = {
  寅: '巳', 午: '巳', 戌: '巳',
  巳: '申', 酉: '申', 丑: '申',
  申: '亥', 子: '亥', 辰: '亥',
  亥: '寅', 卯: '寅', 未: '寅',
};
const GUAGU_BRANCH: Record<string, string> = {
  寅: '丑', 午: '丑', 戌: '丑',
  巳: '辰', 酉: '辰', 丑: '辰',
  申: '未', 子: '未', 辰: '未',
  亥: '戌', 卯: '戌', 未: '戌',
};

// 季节判定（公历月份）
function getSeason(date: Date) {
  const m = date.getMonth() + 1;
  const day = date.getDate();
  if ((m === 11 && day >= 7) || m === 12 || m === 1 || (m === 2 && day < 4)) {
    return { type: 'water' as const, label: '水旺', range: '11月7日 ~ 2月3日', monthLabel: '冬' };
  }
  if ((m === 2 && day >= 4) || m === 3 || m === 4 || (m === 5 && day < 5)) {
    return { type: 'wood' as const, label: '木旺', range: '2月4日 ~ 5月4日', monthLabel: '春' };
  }
  if ((m === 5 && day >= 5) || m === 6 || m === 7 || (m === 8 && day < 7)) {
    return { type: 'fire' as const, label: '火旺', range: '5月5日 ~ 8月6日', monthLabel: '夏' };
  }
  return { type: 'metal' as const, label: '金旺', range: '8月7日 ~ 11月6日', monthLabel: '秋' };
}

const TIDE_TEXT: Record<string, string> = {
  water: '冬藏蓄势，沉静内敛',
  wood: '春生发越，向上生长',
  fire: '夏长繁茂，热情外放',
  metal: '秋收肃敛，专注精进',
};

const FOOD_TIPS = [
  { type: 'water', food: '深色食物：黑芝麻、桑葚、蓝莓、核桃；温热汤品：羊肉汤、红枣桂圆茶。' },
  { type: 'wood', food: '青色酸味：菠菜、青苹果、猕猴桃、柠檬蜂蜜水；芽苗菜、豌豆苗。' },
  { type: 'fire', food: '红色苦味：番茄、红豆、苦瓜、莲子心；少辛辣，多清润。' },
  { type: 'metal', food: '白色辛味：山药、梨、银耳、白萝卜；少油炸，多蒸煮。' },
];

const DESK_DIR: Record<string, { direction: string; mascot: string; footpadColor: string; house: string }> = {
  酉: { direction: '西方（书桌面向西）', mascot: '文昌塔铜摆件', footpadColor: '米白色 / 浅黄', house: '靠西墙，前方视野开阔' },
  申: { direction: '西偏南（书桌面向西南）', mascot: '毛笔架 / 文房四宝', footpadColor: '米白色', house: '靠西南墙，避开门冲' },
  亥: { direction: '西北（书桌面向西北）', mascot: '小鱼缸或流水摆件', footpadColor: '深蓝 / 黑色', house: '靠西北墙，光线柔和' },
  寅: { direction: '东北（书桌面向东北）', mascot: '常青小盆栽', footpadColor: '绿色 / 青色', house: '靠东北墙，自然光充足' },
  巳: { direction: '东南（书桌面向东南）', mascot: '竹制笔筒 / 小盆景', footpadColor: '翠绿色', house: '靠东南墙，通风良好' },
};

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

function formatSolar(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

function buildSolarFromInput(input: EducationInput): Date {
  if (input.calendarType === 'solar') {
    return new Date(input.birthDate);
  }
  // 农历：用 lunar-javascript 反查
  const [y, m, d] = input.birthDate.split('-').map(Number);
  const lunar = Lunar.fromYmd(y, m, d);
  const solar = lunar.getSolar();
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
}

function getFiveElementTalent(dayStem: string, seasonType: string): string {
  const tianGan5: Record<string, string> = {
    甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
    己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
  };
  const me = tianGan5[dayStem] || '木';
  return `日干属${me}，生于${seasonType === 'water' ? '水' : seasonType === 'wood' ? '木' : seasonType === 'fire' ? '火' : '金'}旺之季，${me === '木' ? '向学而生，喜条达而恶压抑' : me === '火' ? '性烈而明，宜以兴趣点燃' : me === '土' ? '敦厚而稳，宜以恒心致远' : me === '金' ? '刚毅而敏，宜以精进为要' : '上善若水，宜以静心涵养'}。`;
}

export function checkEducationRules(input: EducationInput): EducationReport {
  const solar = buildSolarFromInput(input);
  const solarObj = Solar.fromDate(solar);
  const lunarObj = solarObj.getLunar();
  const eightChar = lunarObj.getEightChar();

  // 八字
  const yearGanzhi = eightChar.getYear();
  const monthGanzhi = eightChar.getMonth();
  const dayGanzhi = eightChar.getDay();
  const yearBranch = yearGanzhi.charAt(1);
  const dayStem = dayGanzhi.charAt(0);

  // 季节
  const season = getSeason(solar);

  // 星位
  const wenchang = WENCHANG_BRANCH[dayStem] || '酉';
  const xuetang = XUETANG_STEM[dayStem] || '丙';
  const ciguan = CIGUAN_BRANCH[dayStem] || '亥';
  const huagai = HUAGAI_BRANCH[yearBranch] || '辰';
  const guceng = GUCENG_BRANCH[yearBranch] || '巳';
  const guagu = GUAGU_BRANCH[yearBranch] || '丑';

  // 学业星位对应建议
  const studyRoom = DESK_DIR[wenchang] || DESK_DIR.酉;

  // 饮食
  const foodTip = FOOD_TIPS.find(f => f.type === season.type) || FOOD_TIPS[0];

  // 生肖
  const yearZodiac = lunarObj.getYearShengXiao();

  const solarDate = formatSolar(solar);
  const lunarDate = `${lunarObj.getYearInChinese()}年${lunarObj.getMonthInChinese()}月${lunarObj.getDayInChinese()}`;

  const bazi = {
    yearGanzhi,
    monthGanzhi,
    dayGanzhi,
    yearZodiac,
    dayStem,
    yearBranch,
    solarDate,
    lunarDate,
  };

  return {
    input: {
      name: input.name,
      birthDate: input.birthDate,
      calendarType: input.calendarType,
      grade: input.grade || '',
    },
    bazi,
    season,
    free: {
      origin: {
        title: '🔍 命格溯源',
        content: `${input.name} 生于 ${bazi.solarDate}（${bazi.yearZodiac}年），日柱 ${dayGanzhi}，年柱 ${yearGanzhi}。${getFiveElementTalent(dayStem, season.type)}`,
        source: '《三命通会》《子平真诠》',
      },
      talent: {
        title: '✨ 天赋解读',
        trait: `日干为${dayStem}，${tianGanTrait(dayStem)}`,
        style: tianGanStyle(dayStem),
      },
      code: {
        title: '🔐 学霸密码',
        wenchang,
        xuetang,
        ciguan,
        huagai,
        guceng,
        guagu,
      },
      food: {
        title: '🍵 饮食建议',
        content: foodTip.food,
      },
      studyRoom: {
        title: '📚 书桌布置',
        deskDirection: studyRoom.direction,
        mascot: studyRoom.mascot,
        footpadColor: studyRoom.footpadColor,
        house: studyRoom.house,
      },
    },
    paid: {
      clothing: {
        title: '👕 衣着建议',
        content: `五行${season.type === 'wood' ? '属木，喜青绿色系' : season.type === 'fire' ? '属火，喜红紫色系' : season.type === 'metal' ? '属金，喜白金色系' : season.type === 'water' ? '属水，喜黑蓝色系' : '属土，喜黄咖色系'}；材质以天然棉麻为佳，避免过于鲜艳对比。`,
      },
      housing: {
        title: '🏠 居住朝向',
        content: `命格${season.type === 'water' ? '喜北' : season.type === 'wood' ? '喜东' : season.type === 'fire' ? '喜南' : season.type === 'metal' ? '喜西' : '喜中央'}，卧室或书房宜在该方位；门窗避免直冲，保持空气流通。`,
      },
      travel: {
        title: '✈️ 出行动向',
        content: `利于远行的方位：${season.type === 'water' ? '北方' : season.type === 'wood' ? '东方' : season.type === 'fire' ? '南方' : season.type === 'metal' ? '西方' : '中部地区'}；短途游学、博物馆参观更能开阔视野。`,
      },
      boost: {
        title: '⚡ 提分小贴士',
        content: `1. 充分利用 ${wenchang}位（文昌），书桌朝此方位摆放；2. 床头挂 ${xuetang} 天干对应颜色的小挂件；3. 每晚 21:00-21:30 默读经典 15 分钟。`,
      },
      mindset: {
        title: '🧠 心态引导',
        content: `${input.name} 当前${tideTone(season.type)}，家长宜多鼓励少比较，让孩子在"自己的时区"里稳步前行。`,
      },
    },
  };
}

// --- 辅助：日干对应性格描述 ---
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

function tianGanStyle(stem: string): string {
  const map: Record<string, string> = {
    甲: '宜正向激励，设定明确目标',
    乙: '宜灵活引导，允许试错空间',
    丙: '宜群体学习，发挥领导力',
    丁: '宜深度阅读，沉浸式思考',
    戊: '宜稳扎稳打，按计划推进',
    己: '宜润物无声，环境浸润',
    庚: '宜挑战性任务，攻克难题',
    辛: '宜精雕细琢，质量优先',
    壬: '宜多元探索，触类旁通',
    癸: '宜内观冥想，静能生慧',
  };
  return map[stem] || '因材施教';
}

function tideTone(t: string): string {
  const map: Record<string, string> = {
    water: '正值冬藏蓄势，不宜强压成绩',
    wood: '正值春生发越，宜多尝试',
    fire: '正值夏长繁茂，热情饱满',
    metal: '正值秋收肃敛，专注力强',
  };
  return map[t] || '平稳成长';
}

export interface EducationReport {
  input: { name: string; birthDate: string; calendarType: 'solar' | 'lunar'; grade: string };
  bazi: {
    yearGanzhi: string;
    monthGanzhi: string;
    dayGanzhi: string;
    yearZodiac: string;
    dayStem: string;
    yearBranch: string;
    solarDate: string;
    lunarDate: string;
  };
  season: { type: 'water' | 'fire' | 'wood' | 'metal'; label: string; range: string; monthLabel: string };
  free: {
    origin: { title: string; content: string; source: string };
    talent: { title: string; trait: string; style: string };
    code: { title: string; wenchang: string; xuetang: string; ciguan: string; huagai: string; guceng: string; guagu: string };
    food: { title: string; content: string };
    studyRoom: { title: string; deskDirection: string; mascot: string; footpadColor: string; house: string };
  };
  paid: {
    clothing: { title: string; content: string };
    housing: { title: string; content: string };
    travel: { title: string; content: string };
    boost: { title: string; content: string };
    mindset: { title: string; content: string };
  };
}
