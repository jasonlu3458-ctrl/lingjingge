// ============================================================
// house-rules.ts —— 家居环境 · 玄空大卦规则引擎
// 核心算法：
//   1) 根据性别 + 出生年份推算「命卦」（坎/坤/震/巽/乾/兑/艮/离，共 8）
//   2) 根据命卦划分「东四命」/「西四命」，推出 4 吉方 + 4 凶方
//   3) 命卦 + 大门方位 → 评分（0-100）+ 吉凶详情
//   4) 面积 / 家庭结构 → 5 免费卡 + 3 付费卡内容生成
// ============================================================

// —— 8 方位定义（用于罗盘 + 吉凶判定）——
export const EIGHT_DIRECTIONS = [
  { key: 'east',     cn: '东',   pinyin: 'E',   angle: 0    },
  { key: 'southeast',cn: '东南', pinyin: 'SE',  angle: 45   },
  { key: 'south',    cn: '南',   pinyin: 'S',   angle: 90   },
  { key: 'southwest',cn: '西南', pinyin: 'SW',  angle: 135  },
  { key: 'west',     cn: '西',   pinyin: 'W',   angle: 180  },
  { key: 'northwest',cn: '西北', pinyin: 'NW',  angle: 225  },
  { key: 'north',    cn: '北',   pinyin: 'N',   angle: 270  },
  { key: 'northeast',cn: '东北', pinyin: 'NE',  angle: 315  },
] as const;

export type DirectionKey = typeof EIGHT_DIRECTIONS[number]['key'];

// 方向 → 五行（按后天八卦五行：东/东南=木，南=火，西南/东北=土，西/西北=金，北=水）
// 用映射表替代 194 行那串 `doorCn === 'west' || ...` 联合类型不匹配的硬比较
const DIRECTION_ELEMENT: Record<DirectionKey, '木' | '火' | '土' | '金' | '水'> = {
  east: '木', southeast: '木',
  south: '火',
  southwest: '土', northeast: '土',
  west: '金', northwest: '金',
  north: '水',
};

// —— 8 命卦（含五行、所属"东四/西四"）——
export type GuaKey = 'kan' | 'kun' | 'zhen' | 'xun' | 'qian' | 'dui' | 'gen' | 'li';
export type GuaGroup = 'east' | 'west'; // 东四命 / 西四命

const GUA_META: Record<GuaKey, {
  cn: string;
  element: '水' | '火' | '木' | '土' | '金';
  group: GuaGroup;
  goodDirections: DirectionKey[]; // 4 吉方（按等级：生气 > 天医 > 延年 > 伏位）
}> = {
  kan:  { cn: '坎', element: '水', group: 'east',
    goodDirections: ['north', 'east', 'south', 'southeast'] },
  zhen: { cn: '震', element: '木', group: 'east',
    goodDirections: ['east', 'south', 'southeast', 'north'] },
  xun:  { cn: '巽', element: '木', group: 'east',
    goodDirections: ['southeast', 'east', 'south', 'north'] },
  li:   { cn: '离', element: '火', group: 'east',
    goodDirections: ['south', 'north', 'southeast', 'east'] },
  kun:  { cn: '坤', element: '土', group: 'west',
    goodDirections: ['southwest', 'northeast', 'west', 'northwest'] },
  qian: { cn: '乾', element: '金', group: 'west',
    goodDirections: ['northwest', 'southwest', 'northeast', 'west'] },
  dui:  { cn: '兑', element: '金', group: 'west',
    goodDirections: ['west', 'northwest', 'southwest', 'northeast'] },
  gen:  { cn: '艮', element: '土', group: 'west',
    goodDirections: ['northeast', 'west', 'northwest', 'southwest'] },
};

const GUA_NUMBER_TO_KEY: Record<number, GuaKey> = {
  1: 'kan', 2: 'kun', 3: 'zhen', 4: 'xun',
  5: 'kan', // 过渡数：男命→坎（2 坤分一半给男），女命→坤（这里简化为统一用 kan，传统有争议）
  6: 'qian', 7: 'dui', 8: 'gen', 9: 'li',
};

const GOOD_LEVEL_CN: Record<1 | 2 | 3 | 4, string> = {
  1: '生气方（最旺）',
  2: '天医方（次旺）',
  3: '延年方（和合）',
  4: '伏位方（小吉）',
};

const BAD_LEVEL_CN: Record<1 | 2 | 3 | 4, string> = {
  1: '祸害方（小凶）',
  2: '六煞方（中凶）',
  3: '五鬼方（大凶）',
  4: '绝命方（最凶）',
};

// —— 入口参数类型 ——
export interface HouseInput {
  name: string;
  gender: 'male' | 'female';
  birthYear: number; // 公历年，1900-2100
  doorDirection: DirectionKey; // 大门/主阳台朝向
  area: number; // 平方米
  familyStructure: 'single' | 'couple' | 'family-kids' | 'three-gen' | 'elderly'; // 家庭结构
}

// —— 命卦推算（玄空飞星标准算法）——
function calcLifeGua(birthYear: number, gender: 'male' | 'female'): { guaNumber: number; gua: GuaKey; method: string } {
  // 玄空飞星命卦公式：
  //   男命：(100 - 出生年尾数) % 9，余 0 → 9
  //   女命：(出生年尾数 + 5) % 9，余 0 → 9
  // 注：传统在过渡年（某 9 年）男/女命卦有反推规则，
  //     本算法对尾数为 0 的年份统一为 9（1900、2000、2009 等）
  const tail = birthYear % 100;
  let num: number;
  let method: string;
  if (gender === 'male') {
    // 男命
    const base = 100 - tail;
    num = base % 9 === 0 ? 9 : base % 9;
    method = '男命公式 (100-尾数) % 9';
  } else {
    // 女命
    const base = tail + 5;
    num = base % 9 === 0 ? 9 : base % 9;
    method = '女命公式 (尾数+5) % 9';
  }
  // 边界
  if (num < 1) num = 1;
  if (num > 9) num = 9;
  return { guaNumber: num, gua: GUA_NUMBER_TO_KEY[num], method };
}

// —— 大门方位 → 吉凶等级（1-4） + 分数 ——
function judgeDoor(doorDirection: DirectionKey, guaKey: GuaKey): {
  isGood: boolean;
  level: 1 | 2 | 3 | 4 | null; // 吉方 1-4 / 凶方 1-4
  goodLevel?: 1 | 2 | 3 | 4;
  badLevel?: 1 | 2 | 3 | 4;
  score: number;
  description: string;
} {
  const good = GUA_META[guaKey].goodDirections;
  const bad = EIGHT_DIRECTIONS.map(d => d.key).filter(k => !good.includes(k as DirectionKey));

  const goodIdx = good.indexOf(doorDirection);
  if (goodIdx >= 0) {
    // 吉方：level 1=最旺(90+), 2=次旺(85), 3=和合(78), 4=小吉(72)
    const level = (goodIdx + 1) as 1 | 2 | 3 | 4;
    const baseScore = [95, 88, 80, 73][goodIdx];
    return {
      isGood: true,
      level,
      goodLevel: level,
      score: baseScore,
      description: `大门朝向「${EIGHT_DIRECTIONS.find(d => d.key === doorDirection)!.cn}」正是您的${GOOD_LEVEL_CN[level]}，主家运昌盛、招财纳福。`,
    };
  }

  const badIdx = bad.indexOf(doorDirection);
  if (badIdx >= 0) {
    // 凶方：level 1=小凶(58), 2=中凶(45), 3=大凶(32), 4=最凶(22)
    const level = (badIdx + 1) as 1 | 2 | 3 | 4;
    const baseScore = [60, 48, 35, 25][badIdx];
    return {
      isGood: false,
      level,
      badLevel: level,
      score: baseScore,
      description: `大门朝向「${EIGHT_DIRECTIONS.find(d => d.key === doorDirection)!.cn}」正对您的${BAD_LEVEL_CN[level]}，长期居住易导致${level === 4 ? '家运衰败' : level === 3 ? '是非口舌' : level === 2 ? '健康隐忧' : '小波折不断'}，建议通过化煞物品调整。`,
    };
  }

  // fallback
  return { isGood: false, level: null, score: 50, description: '' };
}

// —— 免费 5 卡内容生成（基于命卦 + 大门 + 面积 + 家庭结构）——
function buildFreeCards(input: HouseInput, lifeGuaInfo: { guaNumber: number; gua: GuaKey; method: string }, door: ReturnType<typeof judgeDoor>, areaCtx: string, familyCtx: string) {
  const guaMeta = GUA_META[lifeGuaInfo.gua];
  const doorCn = EIGHT_DIRECTIONS.find(d => d.key === input.doorDirection)!.cn;
  const goodCn = guaMeta.goodDirections.map(k => EIGHT_DIRECTIONS.find(d => d.key === k)!.cn);
  const badCn = EIGHT_DIRECTIONS.filter(d => !guaMeta.goodDirections.includes(d.key as DirectionKey)).map(d => d.cn);

  return {
    gua: {
      title: '命卦速览',
      content: `您属于「${guaMeta.cn}卦」命，属${guaMeta.element}行，${guaMeta.group === 'east' ? '东四命' : '西四命'}。${guaMeta.group === 'east' ? '喜东、南、东南、北四个方位；忌西、西南、西北、东北' : '喜西、西南、西北、东北四个方位；忌东、南、东南、北'}。推算方式：${lifeGuaInfo.method}。`,
    },
    goodDir: {
      title: '4 大吉方',
      content: `您的吉方依次为：${goodCn.join('、')}。大门、卧室、书房门窗朝向这些方位，能顺势吸纳家运；其中「${goodCn[0]}」为最旺生气方，最适合设置家中财位或主入口。`,
    },
    badDir: {
      title: '4 大凶方',
      content: `您的凶方为：${badCn.join('、')}。这些方位不宜安放床铺、长期书桌、神位；可作为储物间、客卫、走廊等"过路"功能区，把动线绕开。`,
    },
    door: {
      title: '大门方位诊断',
      content: door.description + (door.score >= 80 ? '现状较为理想，建议保持门内整洁明亮。' : door.score >= 50 ? '尚可，注意用绿植或玄关缓冲。' : '建议重点化解，可加门槛石、玄关镜或调转主入口方向。'),
    },
    harmony: {
      title: '家庭和谐度',
      content: `${familyCtx}居住在${input.area}㎡${areaCtx}的空间，${input.area < 60 ? '空间偏紧凑，建议采用浅色原木+多收纳' : input.area < 120 ? '空间适中，重点关注动线与功能分区' : '空间宽裕，可规划家庭核心区与个人静区'}，让${input.familyStructure === 'family-kids' ? '孩子有独立学习角' : input.familyStructure === 'three-gen' ? '三代人各有私密空间' : input.familyStructure === 'elderly' ? '老人房靠近卫生间、避免湿滑' : '家庭成员各有归属'}。`,
    },
  };
}

// —— 付费 3 卡内容（化解 + 流年 + 赋能）——
function buildPaidCards(input: HouseInput, lifeGuaInfo: { guaNumber: number; gua: GuaKey }, door: ReturnType<typeof judgeDoor>, year: number = new Date().getFullYear()) {
  const guaMeta = GUA_META[lifeGuaInfo.gua];
  const doorCn = EIGHT_DIRECTIONS.find(d => d.key === input.doorDirection)!.cn;

  return {
    remedy: {
      title: '特殊化解方案',
      content: door.isGood
        ? `您的大门朝${doorCn}已是大吉，无需大动。锦上添花建议：① 入门左侧放一盆阔叶绿植（如龟背竹），化煞生旺；② 玄关地面铺设深色地垫，稳住家运；③ 每年立春更换门垫颜色（${year}年木旺可选绿色系），让气场流动。`
        : `您的大门朝${doorCn}正对${guaMeta.cn}命${door.isGood ? '吉' : '凶'}方，化解方案三件套：① 入门正对面挂"山海镇"或圆形凸面镜，引吉避凶；② 大门内侧铺深红/紫红地垫（红色五行火，能泄${DIRECTION_ELEMENT[input.doorDirection]}之气）；③ 每周一清晨在门槛洒少量粗盐，连续 3 周可净宅。`,
    },
    yearEnergy: {
      title: `${year} 年流年家宅气运`,
      content: `${year} 年为${year}，${year % 4 === 0 ? '木运当旺' : year % 4 === 1 ? '火运当旺' : year % 4 === 2 ? '土运当旺' : '金运当旺'}。结合您的${guaMeta.cn}命${guaMeta.element}行：${guaMeta.element === '木' && year % 4 === 0 ? '本年与您命格相生，家运整体上扬，宜动不宜静' : guaMeta.element === '火' && year % 4 === 1 ? '本年与命格比和，事业财运双收，注意健康' : guaMeta.element === '土' && year % 4 === 2 ? '本年命格受泄，宜稳守不宜大动' : '本年与命格略有相克，多用暖色调与圆形家具化解'}。${guaMeta.goodDirections[0] ? `${EIGHT_DIRECTIONS.find(d => d.key === guaMeta.goodDirections[0])!.cn}方` : '家中央'}是本年最该精心布置的核心区域。`,
    },
    empower: {
      title: '空间心灵赋能',
      content: `家是身心的延伸。基于${input.name}的${guaMeta.cn}命特质，${guaMeta.group === 'east' ? '东四命' : '西四命'}家庭的空间赋能清单：① 客厅挂一幅山水画（横长幅最佳），象征"气"有源有归；② 卧室床头朝${EIGHT_DIRECTIONS.find(d => d.key === guaMeta.goodDirections[1])!.cn}，能让您深度放松；③ 每周日傍晚点一盏 7 孔莲花灯 15 分钟，清心净宅；④ 在${EIGHT_DIRECTIONS.find(d => d.key === guaMeta.goodDirections[0])!.cn}角放一盆金边虎皮兰，旺家运。`,
    },
  };
}

// ============================================================
// 主入口：checkHouseRules
// ============================================================
export function checkHouseRules(input: HouseInput) {
  // 1) 命卦
  const lifeGuaInfo = calcLifeGua(input.birthYear, input.gender);
  const guaMeta = GUA_META[lifeGuaInfo.gua];

  // 2) 大门方位诊断
  const door = judgeDoor(input.doorDirection, lifeGuaInfo.gua);

  // 3) 面积 / 家庭结构的辅助文案
  const areaCtx =
    input.area < 50 ? '小户型' :
    input.area < 90 ? '中小户型' :
    input.area < 140 ? '中大户型' :
    '大户型';
  const familyCtx =
    input.familyStructure === 'single' ? '独居者' :
    input.familyStructure === 'couple' ? '二人世界' :
    input.familyStructure === 'family-kids' ? '有孩子的核心家庭' :
    input.familyStructure === 'three-gen' ? '三代同堂' :
    '退休长者居所';

  // 4) 评分综合 = 大门基础分 + 命卦契合度 + 面积/家庭适配微调
  let score = door.score;
  // 命卦落在最吉/最凶的极端时，加权 ±5
  if (door.goodLevel === 1) score += 3;
  if (door.badLevel === 4) score -= 5;
  // 极端面积/家庭结构扣 2-5
  if (input.area < 40 && input.familyStructure !== 'single') score -= 4;
  if (input.area > 250) score -= 3;
  score = Math.max(15, Math.min(100, score));

  // 5) 吉凶方（按等级排序）
  const goodDirections = guaMeta.goodDirections.map((k, i) => {
    const dir = EIGHT_DIRECTIONS.find(d => d.key === k)!;
    return {
      key: k,
      cn: dir.cn,
      pinyin: dir.pinyin,
      level: (i + 1) as 1 | 2 | 3 | 4,
      levelName: GOOD_LEVEL_CN[(i + 1) as 1 | 2 | 3 | 4],
      meaning: i === 0 ? '生气：财运最旺、事业亨通' :
               i === 1 ? '天医：健康延寿、家宅和睦' :
               i === 2 ? '延年：夫妻和合、老人安康' :
                        '伏位：稳健守成、小有进益',
    };
  });
  const badDirections = EIGHT_DIRECTIONS
    .filter(d => !guaMeta.goodDirections.includes(d.key as DirectionKey))
    .map((d, i) => ({
      key: d.key,
      cn: d.cn,
      pinyin: d.pinyin,
      level: (i + 1) as 1 | 2 | 3 | 4,
      levelName: BAD_LEVEL_CN[(i + 1) as 1 | 2 | 3 | 4],
      meaning: i === 0 ? '祸害：是非口舌、小人作祟' :
               i === 1 ? '六煞：婚恋波折、健康隐忧' :
               i === 2 ? '五鬼：破财官非、心神不宁' :
                        '绝命：家运衰败、最凶',
    }));

  // 6) 免费 5 卡 + 付费 3 卡
  const free = buildFreeCards(input, lifeGuaInfo, door, areaCtx, familyCtx);
  const paid = buildPaidCards(input, lifeGuaInfo, door);

  return {
    input,
    guaNumber: lifeGuaInfo.guaNumber,
    guaKey: lifeGuaInfo.gua,
    guaCn: guaMeta.cn,
    guaElement: guaMeta.element,
    guaGroup: guaMeta.group, // 'east' | 'west'
    guaMethod: lifeGuaInfo.method,
    doorCn: EIGHT_DIRECTIONS.find(d => d.key === input.doorDirection)!.cn,
    doorIsGood: door.isGood,
    doorGoodLevel: door.goodLevel,
    doorBadLevel: door.badLevel,
    goodDirections,
    badDirections,
    score,
    free,
    paid,
    meta: {
      generatedAt: new Date().toISOString(),
      engine: '玄空飞星（简化版）',
    },
  };
}

// 类型导出
export type HouseReport = ReturnType<typeof checkHouseRules>;
