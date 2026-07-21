// ============================================================
// lifecode-rules.ts —— AI 生命密码 · 天赋觉醒
// 输入：用户八字 + 个人信息
// 输出：基于日干→10 种人格 / 季节基调 / 当年流年重点
// 与 LifeCodePageClient.LifeCodeReport 完全对齐
// ============================================================

import { Solar } from 'lunar-javascript';

export type Gender = 'female' | 'male';

export interface LifeCodeInput {
  name: string;
  gender: Gender;
  birthDate: string;       // YYYY-MM-DD
  birthHour: number;       // 0-23
  calendarType: 'solar' | 'lunar';
}

// ---------- 五行基础数据 ----------
const STEM_TO_ELEMENT: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

const ELEMENT_COLOR: Record<string, string> = {
  木: '青、绿',
  火: '红、紫',
  土: '黄、咖',
  金: '白、银、金',
  水: '黑、蓝',
};

// ---------- 10 种核心人格（日干 → 人格映射） ----------
const STEM_TO_PERSONALITY: Record<string, {
  label: string;
  personality: string;
  keyTrait: string;
  bestEnvironment: string;
  bestPartner: string;
  description: string;
}> = {
  甲: {
    label: '领袖',
    personality: '参天大木',
    keyTrait: '主导力强、喜欢掌控全局、宁折不弯',
    bestEnvironment: '有清晰晋升通道的大型组织、创业公司 CEO、独立工作室',
    bestPartner: '柔中带刚的「乙木」型，互补而不争功',
    description: '甲木是十天干之首，天生的领导者。你骨子里有一种"此事因我而成"的笃定感 —— 不一定张扬，但身边人会不自觉地把决定权交给你。你的成长路径是先立志、再深耕、最后开枝散叶。',
  },
  乙: {
    label: '智谋',
    personality: '藤蔓柔韧',
    keyTrait: '善用资源、借势成长、柔软而有韧性',
    bestEnvironment: '顾问 / 战略 / 投资 / 文化创意类需要"连接资源"的工作',
    bestPartner: '「甲木」型，靠得住的"主干"，互相成就',
    description: '乙木是柔韧的藤，看似柔弱，实则能攀附参天大树抵达阳光。天赋在于"连接" —— 善于把人脉、资源、信息编织成自己的护城河。',
  },
  丙: {
    label: '开拓',
    personality: '太阳之火',
    keyTrait: '开朗热情、照耀四方、慷慨而不计较',
    bestEnvironment: '台前 / 演讲 / 销售 / 创业 / 任何"被看见"的位置',
    bestPartner: '「壬水」型，能在狂热时给你浇一盆冷静的水',
    description: '丙火是太阳，光芒万丈，不为照亮自己，而是为照亮万物。你天生有"点燃他人"的能力 —— 你的热情能感染整个团队，缺点是有时太亮，会灼伤自己。',
  },
  丁: {
    label: '滋养',
    personality: '烛火之光',
    keyTrait: '温暖细腻、深入人心、洞察幽微',
    bestEnvironment: '心理 / 教育 / 写作 / 治疗 / 一对一深度服务类',
    bestPartner: '「甲木」或「丙火」型，给你方向感和舞台',
    description: '丁火是烛光，不像太阳那样照亮万物，但能在黑暗中给特定的人指引方向。你天生能"看见"别人看不见的细节，擅长一对一深度陪伴。',
  },
  戊: {
    label: '厚重',
    personality: '大地之土',
    keyTrait: '稳重踏实、值得信赖、包容万物',
    bestEnvironment: '管理岗 / 平台型业务 / 长期主义项目',
    bestPartner: '「癸水」型，用细腻激活你的厚重',
    description: '戊土是厚德载物的大地，所有人踩在你身上都感到安稳。你是天然的"中流砥柱"，但也容易因为"什么都扛"而失去自我节奏。',
  },
  己: {
    label: '包容',
    personality: '田园之土',
    keyTrait: '滋养万物、善于妥协、亲和力强',
    bestEnvironment: 'HR / 社群运营 / 客户服务 / 农业 / 园艺类',
    bestPartner: '「甲木」型，需要一个能"破土而出"的方向',
    description: '己土是田园，不是高山，是默默孕育万物的土壤。你天生懂得"因材施教"，能根据不同人给出不同滋养方式，但有时会被别人利用你的包容。',
  },
  庚: {
    label: '决断',
    personality: '金刚之锐',
    keyTrait: '锋利直接、改革先锋、嫉恶如仇',
    bestEnvironment: '法律 / 外科 / 审计 / 危机公关 / 任何需要"快刀斩乱麻"的场景',
    bestPartner: '「丁火」或「乙木」型，用温柔软化你的锋利',
    description: '庚金是未经打磨的矿石，锋利、有棱角。你是天然的"破局者" —— 看不惯的事一定要说，看不惯的局面一定要改。',
  },
  辛: {
    label: '精致',
    personality: '珠玉之金',
    keyTrait: '审美敏锐、追求完美、内敛而精致',
    bestEnvironment: '设计 / 品牌 / 艺术 / 手作 / 高端服务业',
    bestPartner: '「丙火」型，能欣赏你的精致并把你"擦亮"',
    description: '辛金是珠玉，比庚金更内敛、更精致。你天生对美有极致追求，擅长在别人忽略的细节里发现价值。',
  },
  壬: {
    label: '智慧',
    personality: '江河之水',
    keyTrait: '大气磅礴、善于变通、智深如海',
    bestEnvironment: '战略 / 投资 / 跨国业务 / 学术研究',
    bestPartner: '「丙火」型，你的冷静需要太阳的温度',
    description: '壬水是长江大河，不择溪涧，终归大海。你天生视野开阔，擅长在大尺度上思考问题。',
  },
  癸: {
    label: '玄思',
    personality: '雨露之水',
    keyTrait: '敏感细腻、直觉敏锐、洞察人心',
    bestEnvironment: '写作 / 心理 / 命理 / 哲学 / 艺术创作',
    bestPartner: '「戊土」型，给你稳稳的落脚点',
    description: '癸水是雨露，无声润物，比壬水更细腻、更内敛。你天生是"看见别人灵魂"的人，但也容易被情绪反噬。',
  },
};

// ---------- 出生季节（按阳历月份划分，四季 + 四季末） ----------
function getBirthSeason(date: Date): {
  type: '春' | '夏' | '秋' | '冬' | '四季末';
  label: string;
  energy: string;
  element: '木' | '火' | '土' | '金' | '水';
} {
  const m = date.getMonth() + 1;
  if (m === 2 || m === 3 || m === 4) {
    return { type: '春', label: '春 · 木旺生发', energy: '向上生发、新生、萌芽', element: '木' };
  }
  if (m === 5 || m === 6 || m === 7) {
    return { type: '夏', label: '夏 · 火旺繁茂', energy: '热烈、绽放、能量外放', element: '火' };
  }
  if (m === 8 || m === 9 || m === 10) {
    return { type: '秋', label: '秋 · 金旺肃敛', energy: '收敛、收获、聚焦核心', element: '金' };
  }
  // 11 / 12 / 1
  return { type: '冬', label: '冬 · 水旺收藏', energy: '内省、蓄势、沉淀', element: '水' };
}

// ---------- 流年天干地支（标准计算） ----------
function getYearGanzhi(year: number): string {
  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const stem = STEMS[(year - 4) % 10];
  const branch = BRANCHES[(year - 4) % 12];
  return stem + branch;
}

// ---------- 五行生克（流年对日干的作用） ----------
const STEM_SHENG: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
};
const STEM_KE: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  木: '土', 火: '金', 土: '水', 金: '木', 水: '火',
};

function getYearRelation(dayElement: '木' | '火' | '土' | '金' | '水', yearStem: string) {
  const yearElement = STEM_TO_ELEMENT[yearStem];
  if (!yearElement) {
    return { type: '比和' as const, focus: '本我显现', area: '自我', desc: '流年信息不明，专注自我成长' };
  }
  if (yearElement === dayElement) {
    return { type: '比和' as const, focus: '本我显现', area: '自我觉醒', desc: '流年与你日干同频，是"看见真实自己"的好时机' };
  }
  if (STEM_SHENG[dayElement] === yearElement) {
    return { type: '泄' as const, focus: '表达输出', area: '事业 / 创作', desc: '流年泄你，适合把自己所学、所想大规模输出' };
  }
  if (STEM_SHENG[yearElement] === dayElement) {
    return { type: '印' as const, focus: '学习沉淀', area: '学习 / 长辈', desc: '流年生你，适合进修、拜师、找导师' };
  }
  if (STEM_KE[dayElement] === yearElement) {
    return { type: '财' as const, focus: '财富机会', area: '财务 / 资源', desc: '流年为你所克，是把握财富机遇的关键年' };
  }
  return { type: '官' as const, focus: '压力中求进', area: '事业 / 责任', desc: '流年克你，压力较大但也是建功立业年' };
}

// ============================================================
// 输出
// ============================================================
export interface LifeCodeReport {
  input: {
    name: string;
    gender: Gender;
    birthDate: string;
    calendarType: 'solar' | 'lunar';
  };
  bazi: {
    yearGanzhi: string;
    monthGanzhi: string;
    dayGanzhi: string;
    yearZodiac: string;
    yearBranch: string;
    dayStem: string;
    dayElement: '木' | '火' | '土' | '金' | '水';
    solarDate: string;
    lunarDate: string;
  };
  coreCode: {
    label: string;
    personality: string;
    keyTrait: string;
    color: string;
    element: '木' | '火' | '土' | '金' | '水';
    bestEnvironment: string;
    bestPartner: string;
  };
  seasonType: {
    type: '春' | '夏' | '秋' | '冬' | '四季末';
    label: string;
    energy: string;
    element: '木' | '火' | '土' | '金' | '水';
  };
  currentYearAdvice: {
    year: number;
    yearGanzhi: string;
    relation: '比和' | '泄' | '印' | '财' | '官';
    focus: string;
    area: string;
    suggestion: string;
  };
  free: {
    origin:      { title: string; content: string };
    personality: { title: string; content: string };
    relationship:{ title: string; content: string };
    potential:   { title: string; content: string };
    whisper:     { title: string; content: string };
  };
  paid: {
    growth:     { title: string; content: string };
    soulmate:   { title: string; content: string };
    careerPath: { title: string; content: string };
    lifeSeason: { title: string; content: string };
    threeSteps: { title: string; content: string };
  };
  score: number;
}

export function checkLifeCodeRules(input: LifeCodeInput): LifeCodeReport {
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
  const dayElement = STEM_TO_ELEMENT[dayStem] as '木' | '火' | '土' | '金' | '水';

  // 核心人格
  const persona = STEM_TO_PERSONALITY[dayStem] || STEM_TO_PERSONALITY['甲'];

  // 出生季节
  const season = getBirthSeason(solar);

  // 当年流年
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearGanzhiNow = getYearGanzhi(currentYear);
  const yearStem = yearGanzhiNow.charAt(0);
  const relation = getYearRelation(dayElement, yearStem);

  // 综合评分
  let score = 60;
  // 日干-季节匹配（25 分）
  if (season.element === dayElement) score += 25;
  else if (season.element === '土' && (dayElement === '火' || dayElement === '金')) score += 15;
  else score += 5;
  // 日干-流年关系（15 分）
  const relationBonus: Record<string, number> = { 比和: 15, 印: 12, 泄: 8, 财: 10, 官: 5 };
  score += relationBonus[relation.type] ?? 5;
  score = Math.max(0, Math.min(100, score));

  return {
    input: {
      name: input.name,
      gender: input.gender,
      birthDate: input.birthDate,
      calendarType: input.calendarType,
    },
    bazi: {
      yearGanzhi,
      monthGanzhi,
      dayGanzhi,
      yearZodiac,
      yearBranch,
      dayStem,
      dayElement,
      solarDate: solarObj.toString().split(' ')[0],
      lunarDate: lunarObj.getYearInChinese() + '年' + lunarObj.getMonthInChinese() + '月' + lunarObj.getDayInChinese(),
    },
    coreCode: {
      label: persona.label,
      personality: persona.personality,
      keyTrait: persona.keyTrait,
      color: ELEMENT_COLOR[dayElement],
      element: dayElement,
      bestEnvironment: persona.bestEnvironment,
      bestPartner: persona.bestPartner,
    },
    seasonType: season,
    currentYearAdvice: {
      year: currentYear,
      yearGanzhi: yearGanzhiNow,
      relation: relation.type,
      focus: relation.focus,
      area: relation.area,
      suggestion: relation.desc,
    },
    free: {
      origin: {
        title: '🧬 核心人格溯源',
        content: persona.description,
      },
      personality: {
        title: '🎭 性格解码',
        content: `你的性格底色是「${persona.label} · ${persona.personality}」。最鲜明的特质是：${persona.keyTrait}。这意味着你在大多数时候会下意识地用"${persona.label}视角"看世界 —— 这是你的天赋，也是你的盲区。`,
      },
      relationship: {
        title: '💞 关系匹配',
        content: `你最适合的伴侣类型是：${persona.bestPartner}。互补而非雷同的关系才能让你长期舒适。`,
      },
      potential: {
        title: '✨ 天赋潜力',
        content: `你最被低估的天赋在"${persona.label}视角"上 —— 把它放在合适的工作环境里（${persona.bestEnvironment}），你能做出别人 3 倍的努力却拿不到的成绩。`,
      },
      whisper: {
        title: '🌙 灵魂低语',
        content: getWhisper(dayElement, relation.type),
      },
    },
    paid: {
      growth: {
        title: '🌱 成长路线图',
        content: '解锁后查看：基于你 10 种人格的"3 个成长阶段 + 5 本必读书 + 3 个习惯"，帮你把天赋落进日常。',
      },
      soulmate: {
        title: '💞 灵魂伴侣画像',
        content: '解锁后查看：基于你日干 × 季节 × 流年的"3 类高匹配伴侣 + 3 类避雷类型"，附具体识别问题清单。',
      },
      careerPath: {
        title: '🛤️ 事业方向',
        content: '解锁后查看：未来 3 年的事业节奏 + 5 个适合你的细分赛道 + 创业 / 打工的取舍建议。',
      },
      lifeSeason: {
        title: '🍂 人生季节',
        content: '解锁后查看：你人生的"春夏秋冬"分布图 —— 哪 10 年是播种期、哪 10 年是收获期、哪 10 年是蛰伏期。',
      },
      threeSteps: {
        title: '🎯 3 步觉醒清单',
        content: '解锁后查看：明早 / 本周 / 本月可以立刻做的 3 件小事，开启你"知命而行"的人生。',
      },
    },
    score,
  };
}

// ============================================================
// 工具函数
// ============================================================
function buildSolarFromInput(input: LifeCodeInput): Date {
  if (input.calendarType === 'solar') {
    return new Date(`${input.birthDate}T${String(input.birthHour).padStart(2, '0')}:00:00`);
  }
  // 农历：交给 lunar-javascript 转阳历
  // 注：lunar-typescript 的 .d.ts 缺 getDate 声明，运行时其实存在
  const [y, m, d] = input.birthDate.split('-').map(Number);
  const solar = Solar.fromYmd(y, m, d);
  return (solar as any).getDate() as Date;
}

function getWhisper(element: '木' | '火' | '土' | '金' | '水', relation: string): string {
  const base: Record<string, string> = {
    木: '你不是一棵只能独自生长的树，你是一整片森林的种子。',
    火: '你的光不是为了让别人看见，是为了让别人看见自己。',
    土: '你承载的比你以为的多，但请记得 —— 承载不是被压垮。',
    金: '你不是要被磨平棱角的矿石，你是该被雕琢成器的那块原石。',
    水: '你流向哪里，哪里就是你的海。',
  };
  const suffix: Record<string, string> = {
    比和: '今年是"看见自己"的一年。',
    印: '今年是"被看见"的一年，找个能教你的前辈。',
    泄: '今年是"输出"的一年，把你会的都写出来 / 讲出来。',
    财: '今年是"抓住"的一年，机会在你手里，主动出击。',
    官: '今年是"扛住"的一年，压力过后，你就是新的你。',
  };
  return `${base[element]} ${suffix[relation] || ''}`;
}
