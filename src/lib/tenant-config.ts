export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
}

export interface TenantThemeConfig {
  primary: string;
  primary_light: string;
  primary_dark: string;
  gold: string;
  gold_light: string;
  gold_dark: string;
  bg_dark: string;
  bg_card: string;
  text_primary: string;
  text_secondary: string;
  text_muted: string;
  border_color: string;
}

export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  theme_config: TenantThemeConfig;
  enabled_features: NavItem[];
}

export const DEFAULT_THEME_CONFIG: TenantThemeConfig = {
  primary: '#8B4513',
  primary_light: '#A0522D',
  primary_dark: '#6B3410',
  gold: '#D4AF37',
  gold_light: '#F0D77E',
  gold_dark: '#B8962E',
  bg_dark: '#0a0a0a',
  bg_card: '#1a1a1a',
  text_primary: '#D4AF37',
  text_secondary: '#C0C0C0',
  text_muted: '#808080',
  border_color: '#333333',
};

export const DEFAULT_ENABLED_FEATURES: NavItem[] = [
  {
    label: '智测AI',
    href: '/muxintang/tools',
    icon: '🔮',
    children: [
      { label: '生命代码', href: '/muxintang/tools/bazi', icon: '☯️' },
      { label: '择日智选', href: '/muxintang/tools/chooseday', icon: '🕰️' },
      { label: '流年大势', href: '/muxintang/tools/trend', icon: '⭐' },
      { label: '姓名心解', href: '/muxintang/tools/name', icon: '✍️' },
      { label: '情缘合盘', href: '/muxintang/tools/match', icon: '💕' },
      { label: '家居环境', href: '/muxintang/tools/habitat', icon: '🏠' },
    ],
  },
  {
    label: '密法灵学',
    href: '/muxintang/channel',
    icon: '📚',
    children: [
      { label: '灵学专栏', href: '/muxintang/channel', icon: '📖' },
      { label: '吉祥日历', href: '/muxintang/auspicious', icon: '🗓️' },
    ],
  },
  {
    label: '行者故事',
    href: '/muxintang/learn',
    icon: '📖',
    children: [
      { label: '修行笔记', href: '/muxintang/learn', icon: '📝' },
      { label: '电子书单', href: '/muxintang/learn/ebooks', icon: '📚' },
    ],
  },
  {
    label: '吉祥馆',
    href: '/muxintang/jixiangju',
    icon: '🏮',
    children: [
      { label: '商品列表', href: '/muxintang/jixiangju', icon: '🛍️' },
      { label: '购物车', href: '/muxintang/jixiangju/cart', icon: '🛒' },
      { label: '我的订单', href: '/muxintang/jixiangju?tab=orders', icon: '📋' },
    ],
  },
  {
    label: '爱宠屋',
    href: '/muxintang/pet',
    icon: '🐾',
    children: [
      { label: '爱宠起名', href: '/muxintang/pet/naming', icon: '🐾' },
      { label: '吉祥配饰', href: '/muxintang/pet/accessories', icon: '💎' },
      { label: '衣食住行', href: '/muxintang/pet/diet', icon: '🥣' },
      { label: '爱宠超度', href: '/muxintang/pet/liberation', icon: '🪷' },
    ],
  },
  {
    label: '关于我',
    href: '/muxintang/about',
    icon: '👤',
  },
];

export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  id: 'muxintang',
  name: '牧心堂',
  slug: 'muxintang',
  theme_config: DEFAULT_THEME_CONFIG,
  enabled_features: DEFAULT_ENABLED_FEATURES,
};

export function parseThemeConfig(config: unknown): TenantThemeConfig {
  if (!config || typeof config !== 'object') {
    return DEFAULT_THEME_CONFIG;
  }
  
  const c = config as Record<string, unknown>;
  return {
    primary: typeof c.primary === 'string' ? c.primary : DEFAULT_THEME_CONFIG.primary,
    primary_light: typeof c.primary_light === 'string' ? c.primary_light : DEFAULT_THEME_CONFIG.primary_light,
    primary_dark: typeof c.primary_dark === 'string' ? c.primary_dark : DEFAULT_THEME_CONFIG.primary_dark,
    gold: typeof c.gold === 'string' ? c.gold : DEFAULT_THEME_CONFIG.gold,
    gold_light: typeof c.gold_light === 'string' ? c.gold_light : DEFAULT_THEME_CONFIG.gold_light,
    gold_dark: typeof c.gold_dark === 'string' ? c.gold_dark : DEFAULT_THEME_CONFIG.gold_dark,
    bg_dark: typeof c.bg_dark === 'string' ? c.bg_dark : DEFAULT_THEME_CONFIG.bg_dark,
    bg_card: typeof c.bg_card === 'string' ? c.bg_card : DEFAULT_THEME_CONFIG.bg_card,
    text_primary: typeof c.text_primary === 'string' ? c.text_primary : DEFAULT_THEME_CONFIG.text_primary,
    text_secondary: typeof c.text_secondary === 'string' ? c.text_secondary : DEFAULT_THEME_CONFIG.text_secondary,
    text_muted: typeof c.text_muted === 'string' ? c.text_muted : DEFAULT_THEME_CONFIG.text_muted,
    border_color: typeof c.border_color === 'string' ? c.border_color : DEFAULT_THEME_CONFIG.border_color,
  };
}

export function parseEnabledFeatures(features: unknown): NavItem[] {
  if (!Array.isArray(features)) {
    return DEFAULT_ENABLED_FEATURES;
  }
  
  const validFeatures: NavItem[] = [];
  for (const item of features) {
    if (item && typeof item === 'object') {
      const i = item as Record<string, unknown>;
      if (typeof i.label === 'string' && typeof i.href === 'string') {
        const navItem: NavItem = {
          label: i.label,
          href: i.href,
          icon: typeof i.icon === 'string' ? i.icon : undefined,
        };
        if (Array.isArray(i.children)) {
          const children: NavItem[] = [];
          for (const child of i.children) {
            if (child && typeof child === 'object') {
              const c = child as Record<string, unknown>;
              if (typeof c.label === 'string' && typeof c.href === 'string') {
                children.push({
                  label: c.label,
                  href: c.href,
                  icon: typeof c.icon === 'string' ? c.icon : undefined,
                });
              }
            }
          }
          if (children.length > 0) {
            navItem.children = children;
          }
        }
        validFeatures.push(navItem);
      }
    }
  }
  
  return validFeatures.length > 0 ? validFeatures : DEFAULT_ENABLED_FEATURES;
}

export function buildThemeCSS(theme: TenantThemeConfig): string {
  return `
    :root {
      --primary: ${theme.primary};
      --primary-light: ${theme.primary_light};
      --primary-dark: ${theme.primary_dark};
      --gold: ${theme.gold};
      --gold-light: ${theme.gold_light};
      --gold-dark: ${theme.gold_dark};
      --bg-dark: ${theme.bg_dark};
      --bg-card: ${theme.bg_card};
      --text-primary: ${theme.text_primary};
      --text-secondary: ${theme.text_secondary};
      --text-muted: ${theme.text_muted};
      --border-color: ${theme.border_color};
    }
  `;
}

/**
 * 将 #RRGGBB 转为带 alpha 的 rgba(...)
 * 注意：Tailwind 的 bg-xxx/95 语法只对类名有效，inline style 必须用 rgba。
 */
export function withAlpha(hex: string, alpha: number): string {
  if (typeof hex !== 'string') return hex;
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}