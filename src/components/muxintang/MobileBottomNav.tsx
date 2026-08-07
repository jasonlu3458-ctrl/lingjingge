'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { NavItem, TenantThemeConfig } from '@/lib/tenant-config';
import { withAlpha } from '@/lib/tenant-config';

interface MobileBottomNavProps {
  theme?: TenantThemeConfig;
  extraConfig?: Record<string, boolean>;
  menuItems?: NavItem[];
}

const MUXINTANG_ICON_MAP: Record<string, string> = {
  '智测AI': '🔮',
  '密法灵学': '📚',
  '行者故事': '📖',
  '吉祥馆': '🏮',
  '爱宠屋': '🐾',
  '关于我': '👤',
  '道场': '🏠',
  '智测': '🔮',
  '专栏': '📚',
  '故事': '📖',
  '我的': '👤',
};

const MUXINTANG_ITEMS = [
  { label: '道场', href: '/muxintang', icon: '🏠' },
  { label: '智测', href: '/muxintang/tools', icon: '🔮' },
  { label: '专栏', href: '/muxintang/channel', icon: '📚' },
  { label: '故事', href: '/muxintang/learn', icon: '📖' },
  { label: '我的', href: '/muxintang/me', icon: '👤' },
];

const MAIN_ITEMS = [
  { label: '首页', href: '/', icon: '🏠' },
  { label: '解惑', href: '/wen', icon: '🌙' },
  { label: '内观', href: '/guan', icon: '🪞' },
  { label: '藏经', href: '/zang', icon: '📜' },
  { label: '同修', href: '/tong', icon: '🤝' },
  { label: '我的', href: '/tong/profile', icon: '👤' },
];

function getIconForItem(label: string, href: string): string {
  if (MUXINTANG_ICON_MAP[label]) return MUXINTANG_ICON_MAP[label];
  if (href === '/muxintang') return '🏠';
  if (href.startsWith('/muxintang/tools')) return '🔮';
  if (href.startsWith('/muxintang/channel')) return '📚';
  if (href.startsWith('/muxintang/learn')) return '📖';
  if (href.startsWith('/muxintang/jixiangju')) return '🏮';
  if (href.startsWith('/muxintang/pet')) return '🐾';
  if (href.startsWith('/muxintang/about')) return '👤';
  if (href.startsWith('/muxintang/me')) return '👤';
  return '✨';
}

export default function MobileBottomNav({ theme, extraConfig = {}, menuItems }: MobileBottomNavProps) {
  const pathname = usePathname() || '/';

  // 根布局会在所有页面挂载，需过滤掉不需要导航的页面（如后台 /admin）
  const hideOn = ['/admin', '/api', '/signin', '/login', '/signup'];
  if (hideOn.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const isMuxintang = pathname.startsWith('/muxintang');

  let baseItems: { label: string; href: string; icon: string }[];

  if (isMuxintang && menuItems && menuItems.length > 0) {
    baseItems = menuItems.map((item) => ({
      label: item.label,
      href: item.href,
      icon: item.icon || getIconForItem(item.label, item.href),
    }));
  } else if (isMuxintang) {
    baseItems = MUXINTANG_ITEMS;
  } else {
    baseItems = MAIN_ITEMS;
  }

  const featureItems: { label: string; href: string; icon: string }[] = [];
  if (isMuxintang) {
    if (extraConfig.pet_zone) {
      featureItems.push({ label: '宠物', href: '/muxintang/pet', icon: '🐾' });
    }
    if (extraConfig.ai_wallpaper) {
      featureItems.push({ label: '壁纸', href: '/muxintang/wallpaper', icon: '🖼️' });
    }
  }

  const navItems = [...baseItems, ...featureItems];

  const isMainSite = !isMuxintang;
  // 主站：米白底 + 青蓝色；牧心堂：玄铁黑 + 金色（按现有主题）
  const primaryColor = isMainSite
    ? '#3b6e8f'
    : (theme?.text_primary || '#D4AF37');
  const mutedColor = isMainSite
    ? '#6b6b6b'
    : (theme?.text_muted || '#808080');
  const bgDark = isMainSite
    ? '#ffffff'
    : (theme?.bg_dark || '#0a0a0a');
  const borderColor = isMainSite
    ? '#e5e7eb'
    : (theme?.border_color || '#333333');
  const primary = isMainSite
    ? '#3b6e8f'
    : (theme?.primary || '#8B4513');
  const gold = isMainSite
    ? '#3b6e8f'
    : (theme?.gold || '#D4AF37');

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t pb-safe"
      style={{ backgroundColor: withAlpha(bgDark, 0.98), borderColor }}
    >
      <div className="flex items-stretch justify-around h-16 overflow-x-auto">
        {navItems.map((item) => {
          const exact = pathname === item.href;
          const isSub = !exact && pathname.startsWith(item.href + '/');
          const isActive = isMuxintang
            ? (exact || isSub)
            : (item.href === '/' ? pathname === '/' : exact || isSub);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-1 min-w-[64px] flex-1 h-full transition-all duration-300"
              style={{ color: isActive ? primaryColor : mutedColor }}
            >
              <span className="text-xl transition-transform duration-300">
                {item.icon}
              </span>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 w-8 h-0.5 rounded-full"
                  style={{ background: `linear-gradient(to right, ${primary}, ${gold}, ${primary})` }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
