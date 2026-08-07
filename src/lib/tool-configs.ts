// ============================================================
// tool-configs.ts —— 跨租户工具配置（一份配置，两套外壳）
// ------------------------------------------------------------
// 主站 (/guan/lifecode) 与牧心堂 (/muxintang/tools/bazi) 共享的
// 工具元数据：标题、描述、主题色、Dify 类型。
//
// 使用方式：
//   const cfg = TOOL_CONFIGS.bazi;
//   const title = tenantId === 'muxintang' ? cfg.titleMuxintang : cfg.titleMain;
// ============================================================

export type ToolTheme = 'dark-gold' | 'cosmic-purple' | 'zen-beige' | 'tech-blue';

export interface ToolConfig {
  /** 主站显示标题 */
  titleMain: string;
  /** 牧心堂显示标题 */
  titleMuxintang: string;
  /** 简短描述（SEO/卡片用） */
  description: string;
  /** 调用的 Dify 应用类型（与 /api/dify 网关的 type 字段对应） */
  difyType: string;
  /** 主题风格 */
  theme: ToolTheme;
  /** 是否需付费解锁（影响是否显示付费墙） */
  requiresPaywall: boolean;
  /** 提示文字（引导用户填写表单） */
  hint: string;
}

export const TOOL_CONFIGS: Record<string, ToolConfig> = {
  bazi: {
    titleMain: '生命密码',
    titleMuxintang: '生命代码',
    description: '从公历生日 + 出生时辰推算四柱 / 日主 / 五行能量，洞见天赋底色与人生节律',
    difyType: 'mingli',
    theme: 'dark-gold',
    requiresPaywall: true,
    hint: '请提供您的出生年月日时，阿阇梨为您解读天赋与节律。',
  },
  lifecode: {
    titleMain: '生命密码 · 天赋觉醒',
    titleMuxintang: '生命代码 · 天赋觉醒',
    description: '看见自己本来的样子。AI 助你读懂性格、节律与潜在优势。',
    difyType: 'lifecode',
    theme: 'cosmic-purple',
    requiresPaywall: true,
    hint: '看清自己的剧本，才能写好下一章。',
  },
  match: {
    titleMain: '情缘合盘',
    titleMuxintang: '情缘合盘',
    description: '双性格能量比对：日干十神、五行互补、属相六合三合，揭示缘分深浅与相处之道',
    difyType: 'family',
    theme: 'dark-gold',
    requiresPaywall: false,
    hint: '请输入您与 TA 的出生年月日。',
  },
  name: {
    titleMain: 'AI 取名',
    titleMuxintang: '姓名心解',
    description: '结合性格画像、汉字寓意、音律美感，量身推荐名字',
    difyType: 'name',
    theme: 'dark-gold',
    requiresPaywall: true,
    hint: '请提供姓氏、性别、出生日期与期望气质。',
  },
  habitat: {
    titleMain: 'AI 家居环境',
    titleMuxintang: '家居环境',
    description: '从空间布局、八宅方位、气场流动三维分析家居能量场',
    difyType: 'house',
    theme: 'dark-gold',
    requiresPaywall: true,
    hint: '请描述您的户型与朝向。',
  },
  chooseday: {
    titleMain: '黄道吉日',
    titleMuxintang: '择日智选',
    description: '结合老黄历宜忌与个人情况，选出最适宜的日子',
    difyType: 'chooseday',
    theme: 'dark-gold',
    requiresPaywall: false,
    hint: '请提供事件类型与起止日期。',
  },
  trend: {
    titleMain: '流年趋势',
    titleMuxintang: '流年大势',
    description: '基于流年天干与个人画像，预判全年事业 / 财富 / 感情 / 健康走向',
    difyType: 'trend',
    theme: 'dark-gold',
    requiresPaywall: false,
    hint: '请提供出生年与关注月份。',
  },
};

/** 工具 ID 列表（用于动态校验） */
export const TOOL_IDS = Object.keys(TOOL_CONFIGS) as Array<keyof typeof TOOL_CONFIGS>;

/**
 * 通用取配置函数：传入 toolId，校验存在性并返回
 */
export function getToolConfig(toolId: string): ToolConfig | null {
  return TOOL_CONFIGS[toolId] ?? null;
}

/**
 * 根据租户 ID 取显示标题
 */
export function getToolTitle(toolId: string, tenantId: 'main' | 'muxintang' = 'main'): string {
  const cfg = getToolConfig(toolId);
  if (!cfg) return toolId;
  return tenantId === 'muxintang' ? cfg.titleMuxintang : cfg.titleMain;
}
