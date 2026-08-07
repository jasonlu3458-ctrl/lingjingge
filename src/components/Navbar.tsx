'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UserStatus from './UserStatus';
import CoinsBadge from './CoinsBadge';
import ZenSoundToggle from './ZenSoundToggle';

interface TenantConfig {
  id: string | null;
  name: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  aiPersonaPrefix: string | null;
}

function getTenantConfigFromCookies(): TenantConfig {
  if (typeof document === 'undefined') {
    return { id: null, name: null, logoUrl: null, primaryColor: null, aiPersonaPrefix: null };
  }
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  return {
    id: getCookie('tenant_id'),
    name: getCookie('tenant_name'),
    logoUrl: getCookie('tenant_logo_url'),
    primaryColor: getCookie('tenant_primary_color'),
    aiPersonaPrefix: getCookie('tenant_ai_persona_prefix'),
  };
}

// —— 顶部导航菜单项类型（P0 升级：解惑分 3 段） ——
type MenuGroup = 'emotion' | 'ritual' | 'consult' | null;

interface MenuLinkItem {
  label: string;
  href: string;
  icon?: string;
  /** 分组（仅解惑菜单使用，渲染时插入分割线 + 段标题） */
  group?: MenuGroup;
}

const menuItems: Array<{
  label: string;
  href: string;
  items: Array<MenuLinkItem | { __divider: true; title: string; subtitle: string; color: 'emerald' | 'amber' | 'blue' }>;
  /** 角标（显示在 label 旁，如"✨ 体验版"） */
  badge?: string;
}> = [
  {
    label: '解惑',
    href: '/wen',
    items: [
      // —— 🟢 段 1：陪伴与倾诉（chat-only）——
      { __divider: true, title: '🟢 陪伴与倾诉', subtitle: '禅心已安住，即刻开始', color: 'emerald' },
      { label: 'AI 禅师',     href: '/wen/zen',           icon: '🧘', group: 'emotion' },
      { label: 'AI 解忧师',   href: '/wen/light-solution', icon: '💭', group: 'emotion' },
      { label: 'AI 疗愈师',   href: '/wen/heal',          icon: '💚', group: 'emotion' },
      // —— 🟡 段 2：每日盲盒（click-to-reveal）——
      { __divider: true, title: '🟡 每日盲盒', subtitle: '点一下 · 今日的答案就出现', color: 'amber' },
      { label: 'AI 推背师',   href: '/wen/tuibei',         icon: '📜', group: 'ritual' },
      { label: 'AI 星座师',   href: '/wen/astrology',      icon: '⭐', group: 'ritual' },
      { label: 'AI 生肖师',   href: '/wen/zodiac',         icon: '🐉', group: 'ritual' },
      // —— 🔵 段 3：深度咨询（form-first）——
      { __divider: true, title: '🔵 深度咨询', subtitle: '生辰在手 · 让阿阇梨细解', color: 'blue' },
      { label: 'AI 取名师',   href: '/wen/name',           icon: '✍️', group: 'consult' },
      { label: 'AI 解梦师',   href: '/wen/dream',          icon: '🌙', group: 'consult' },
      { label: 'AI 易理师',   href: '/wen/yili',           icon: '☯️', group: 'consult' },
    ]
  },
  {
    label: '内观',
    href: '/guan',
    items: [
      { label: 'AI生命密码', href: '/guan/lifecode',   icon: '🔮' },
      { label: 'AI婚姻家庭', href: '/guan/family',     icon: '🏠' },
      { label: 'AI事业财富', href: '/guan/wealth',     icon: '💰' },
      { label: 'AI子女教育', href: '/guan/education',  icon: '🌱' },
      { label: 'AI家居环境', href: '/guan/house',      icon: '🏠' },
      { label: 'AI身心合一', href: '/guan/body',       icon: '🌿' },
    ]
  },
  {
    label: '藏经',
    href: '/zang',
    items: [
      { label: '藏经阁',   href: '/zang/library',     icon: '📚' },
      { label: '术语百科', href: '/zang/terms',       icon: '📖' },
      { label: '法脉源流', href: '/zang/lineage',     icon: '📜' },
      { label: '每日话题', href: '/tong/daily-topic', icon: '☀️' },
    ]
  },
  {
    label: '同修',
    href: '/tong/community',
    items: [
      { label: '同修社区', href: '/tong/community',  icon: '🤝' },
      { label: '个人中心', href: '/tong/profile',    icon: '🏠' },
      { label: '会员订阅', href: '/tong/pricing',    icon: '💎' },
      { label: '邀请好友', href: '/tong/invite',     icon: '🎁' },
    ]
  },
  {
    label: '吉祥馆',
    href: '/jixiangju',
    items: [
      { label: '商品列表', href: '/jixiangju', icon: '🛍️' },
      { label: '购物车', href: '/jixiangju/cart', icon: '🛒' },
      { label: '我的订单', href: '/jixiangju/orders', icon: '📋' },
    ]
  },
  {
    label: '爱宠屋',
    href: '/pet',
    items: [
      // 顺序与 src/app/(main)/pet/page.tsx 的 PET_SERVICES 卡片完全一致
      { label: '爱宠起名', href: '/pet/naming',     icon: '🐾' },
      { label: '吉祥配饰', href: '/jixiangju?category=爱宠配饰', icon: '💎' },
      { label: '衣食住行', href: '/pet/daily-care', icon: '🍎' },
      { label: '爱宠超度', href: '/pet/liberation',  icon: '🪷' },
    ]
  },
  {
    label: '牧心堂',
    href: '/muxintang',
    items: [],
  },
];

export interface NavbarProps {
  immersive?: boolean;
}

export default function Navbar({ immersive = false }: NavbarProps = {}) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);

  useEffect(() => {
    const tenant = getTenantConfigFromCookies();
    setTenantConfig(tenant);
  }, []);

  const primaryColor = tenantConfig?.primaryColor || '#f59e0b';
  const tenantName = tenantConfig?.name || '灵境阁';
  const logoUrl = tenantConfig?.logoUrl || '/images/logo.png';

  useEffect(() => {
    if (!immersive) return;
    return undefined;
  }, [immersive]);

  const handleMenuEnter = useCallback((label: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveMenu(label);
  }, []);

  const handleMenuLeave = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setActiveMenu(null);
      closeTimerRef.current = null;
    }, 250);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('nav')) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setActiveMenu(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // —— 顶级菜单渲染函数（PC 端） —— 
  // 解惑 / 内观 / 藏经 / 同修  →  引流/沉淀板块
  // 吉祥馆 / 爱宠屋            →  商业结缘板块
  // 两组之间用一根极淡的细线分隔，提示用户"接下来是结缘区"
  const renderDesktopMenuItem = (menu: typeof menuItems[number]) => (
    <div
      key={menu.label}
      className="relative h-16 flex items-center"
      onMouseEnter={() => menu.items.length > 0 && handleMenuEnter(menu.label)}
      onMouseLeave={handleMenuLeave}
      onFocus={() => menu.items.length > 0 && handleMenuEnter(menu.label)}
      onBlur={handleMenuLeave}
    >
      <Link
        href={menu.href}
        prefetch={true}
        className="px-6 py-2.5 rounded-[20px] font-medium transition-all duration-300 flex items-center gap-2"
        style={
          immersive
            ? {
                backgroundColor: activeMenu === menu.label ? 'rgba(255,255,255,0.92)' : 'transparent',
                color: activeMenu === menu.label ? '#1a1a1a' : 'rgba(255,255,255,0.92)',
                border: `1px solid ${activeMenu === menu.label ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)'}`,
                fontFamily: "'Ma Shan Zheng', cursive, serif",
                letterSpacing: '2px',
                fontSize: '15px',
              }
            : {
                backgroundColor: activeMenu === menu.label ? '#2c2c2c' : 'transparent',
                color: activeMenu === menu.label ? '#f5f0eb' : '#2c2c2c',
                border: '1px solid #2c2c2c',
                fontFamily: "'Ma Shan Zheng', cursive, serif",
                letterSpacing: '2px',
                fontSize: '15px',
              }
        }
      >
        {menu.label}
        {menu.badge && (
          <span
            className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full tracking-wide font-normal ${
              immersive
                ? 'bg-amber-400/20 text-amber-200 border border-amber-300/40'
                : 'bg-amber-100 text-amber-700 border border-amber-300/50'
            }`}
            style={{ fontFamily: "'PingFang SC', sans-serif" }}
          >
            {menu.badge}
          </span>
        )}
        {menu.items.length > 0 && (
          <span className="transition-transform duration-300 text-xs" style={{
            transform: activeMenu === menu.label ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            ▼
          </span>
        )}
      </Link>

      {activeMenu === menu.label && menu.items.length > 0 && (
        <div
          className="absolute top-full left-0 w-full h-2"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {activeMenu === menu.label && menu.items.length > 0 && (
        <div
          className={`absolute top-full left-0 pt-2 rounded-lg shadow-xl border py-4 z-50 ${
            immersive
              ? 'bg-black/90 backdrop-blur-md border-white/15'
              : 'bg-white border-amber-200'
          }`}
          style={{
            animation: 'fadeInDown 0.2s ease-out',
            minWidth: '240px',
            boxShadow: '0 12px 28px rgba(245, 158, 11, 0.18), 0 4px 8px rgba(0,0,0,0.06)',
          }}
          onMouseEnter={() => handleMenuEnter(menu.label)}
          onMouseLeave={handleMenuLeave}
        >
          {menu.items.map((item, idx) => {
            // —— P0：渲染分割线 + 段标题（仅解惑菜单）——
            if ('__divider' in item && item.__divider) {
              const dividerItem = item;
              const colorMap: Record<string, { line: string; text: string; dot: string }> = {
                emerald: { line: 'border-emerald-200/60', text: 'text-emerald-700/80', dot: 'text-emerald-500' },
                amber:   { line: 'border-amber-200/60',   text: 'text-amber-700/80',   dot: 'text-amber-500'   },
                blue:    { line: 'border-blue-200/60',    text: 'text-blue-700/80',    dot: 'text-blue-500'    },
              };
              const c = colorMap[dividerItem.color] || colorMap.amber;
              const isFirst = idx === 0;
              return (
                <div
                  key={`divider-${idx}`}
                  className={`px-4 ${isFirst ? 'pt-1 pb-2' : 'pt-3 pb-2'}`}
                >
                  <div className={`flex items-center gap-2 ${c.text}`}>
                    <span className={`${c.dot} text-sm`}>✦</span>
                    <span
                      className="text-[11px] tracking-[2px] uppercase"
                      style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                    >
                      {dividerItem.title}
                    </span>
                    <span className={`${c.dot} text-sm`}>✦</span>
                  </div>
                  <div
                    className={`mt-1 ml-1 text-[10px] tracking-wider ${c.text} opacity-70`}
                    style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                  >
                    {dividerItem.subtitle}
                  </div>
                  <div className={`mt-1.5 border-t ${c.line}`} />
                </div>
              );
            }
            // —— 普通菜单项 ——
            const linkItem = item as MenuLinkItem;
            return (
              <Link
                key={linkItem.href}
                href={linkItem.href}
                prefetch={true}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm mx-2 rounded-md transition-all duration-200 whitespace-nowrap ${
                  immersive
                    ? 'text-white/85 hover:bg-white/10 hover:text-white'
                    : 'text-gray-700 hover:bg-amber-50 hover:text-amber-900'
                }`}
                style={{
                  fontFamily: "'Ma Shan Zheng', cursive, serif",
                  letterSpacing: '1px',
                }}
              >
                {linkItem.icon && <span className="text-lg leading-none">{linkItem.icon}</span>}
                <span>{linkItem.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 ${
        immersive
          ? 'bg-transparent border-b border-transparent'
          : 'bg-zen-beige border-b border-zen-gray'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/" prefetch={true} className="flex items-center gap-2 group" aria-label="灵境阁首页">
              <Image
                src={logoUrl}
                alt={tenantName}
                width={40}
                height={40}
                className="rounded-full transition-transform duration-300 group-hover:scale-105"
              />
              <span
                className={`text-xl font-serif hidden sm:inline transition-colors duration-500 ${
                  immersive ? 'text-white/90' : 'text-[#2c2c2c]'
                }`}
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {tenantName}
              </span>
            </Link>
          </div>

          <div className="hidden lg:flex gap-2 items-center">
            {menuItems.map((menu) => renderDesktopMenuItem(menu))}

            <div
              aria-label="AI在线指示器"
              className="ml-5"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: immersive ? 'rgba(255,255,255,0.92)' : '#2c2c2c',
                boxShadow: immersive ? '0 0 10px rgba(255,255,255,0.5)' : '0 0 8px rgba(44, 44, 44, 0.4)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <ZenSoundToggle immersive={immersive} />
            <CoinsBadge />
            <UserStatus immersive={immersive} />
          </div>

          <button
            className={`lg:hidden p-2 rounded-lg transition-all duration-150 active:scale-95 active:opacity-80 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              immersive ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
          >
            <svg
              className={`w-6 h-6 transition-colors ${immersive ? 'text-white/90' : 'text-[#2c2c2c]'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/30 z-40 animate-fadeIn"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
        )}

        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 animate-slideDown relative z-50">
            <div
              className={`rounded-xl shadow-lg border overflow-hidden ${
                immersive ? 'bg-black/90 backdrop-blur-md border-white/15' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-end p-2">
                <button
                  onClick={closeMobileMenu}
                  aria-label="关闭菜单"
                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-2xl leading-none transition-all duration-150 active:scale-95 active:opacity-80 ${
                    immersive ? 'text-white/80 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  style={{ fontFamily: 'sans-serif' }}
                >
                  ✕
                </button>
              </div>
              {menuItems.map((menu, index) => (
                <div
                  key={menu.label}
                  className={`last:border-b-0 ${
                    immersive ? 'border-b border-white/10' : 'border-b border-gray-100'
                  }`}
                >
                  <button
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                      immersive ? 'hover:bg-white/10' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
                    style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                  >
                    <span className={immersive ? 'text-white/90' : 'text-[#2c2c2c]'}>{menu.label}</span>
                    {menu.badge && (
                      <span
                        className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full tracking-wide font-normal ${
                          immersive
                            ? 'bg-amber-400/20 text-amber-200 border border-amber-300/40'
                            : 'bg-amber-100 text-amber-700 border border-amber-300/50'
                        }`}
                        style={{ fontFamily: "'PingFang SC', sans-serif" }}
                      >
                        {menu.badge}
                      </span>
                    )}
                    {menu.items.length > 0 && (
                      <span
                        className={`transition-transform duration-300 ${
                          activeMenu === menu.label ? 'rotate-180' : ''
                        } ${immersive ? 'text-white/60' : ''}`}
                      >
                        ▼
                      </span>
                    )}
                  </button>

                  {activeMenu === menu.label && menu.items.length > 0 && (
                    <div
                      className={`px-2 py-2 animate-fadeIn ${
                        immersive ? 'bg-black/60' : 'bg-gray-50'
                      }`}
                    >
                      {menu.items.map((category) =>
                        '__divider' in category && category.__divider ? (
                          // —— P0 移动端：段标题 + 分割线（与桌面端同视觉）——
                          (() => {
                            const dividerItem = category;
                            const colorMap: Record<string, { line: string; text: string; dot: string }> = {
                              emerald: { line: 'border-emerald-200/60', text: 'text-emerald-700/80', dot: 'text-emerald-500' },
                              amber:   { line: 'border-amber-200/60',   text: 'text-amber-700/80',   dot: 'text-amber-500'   },
                              blue:    { line: 'border-blue-200/60',    text: 'text-blue-700/80',    dot: 'text-blue-500'    },
                            };
                            const c = colorMap[dividerItem.color] || colorMap.amber;
                            return (
                              <div
                                key={`mob-divider-${dividerItem.title}`}
                                className="px-3 pt-3 pb-1.5"
                              >
                                <div className={`flex items-center gap-2 ${c.text}`}>
                                  <span className={`${c.dot} text-sm`}>✦</span>
                                  <span
                                    className="text-[11px] tracking-[2px] uppercase"
                                    style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                                  >
                                    {dividerItem.title}
                                  </span>
                                  <span className={`${c.dot} text-sm`}>✦</span>
                                </div>
                                <div
                                  className={`mt-1 ml-1 text-[10px] tracking-wider ${c.text} opacity-70`}
                                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                                >
                                  {dividerItem.subtitle}
                                </div>
                                <div className={`mt-1.5 border-t ${c.line}`} />
                              </div>
                            );
                          })()
                        ) : 'subItems' in category && Array.isArray((category as { subItems?: unknown[] }).subItems) ? (
                          <div key={(category as MenuLinkItem).label}>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                              {(category as MenuLinkItem).label}
                            </div>
                            {((category as { subItems: { href: string; label: string; icon?: string }[] }).subItems).map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                prefetch={true}
                                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors block w-full ${
                                immersive
                                  ? 'text-white/85 hover:bg-white/10 hover:text-white'
                                  : 'text-gray-700 hover:bg-white'
                              }`}
                              >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <Link
                          key={(category as MenuLinkItem).href}
                          href={(category as MenuLinkItem).href}
                          prefetch={true}
                          className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors block w-full ${
                            immersive
                              ? 'text-white/85 hover:bg-white/10 hover:text-white'
                              : 'text-gray-700 hover:bg-white'
                          }`}
                        >
                            <span className="text-lg">{(category as MenuLinkItem).icon}</span>
                            <span>{(category as MenuLinkItem).label}</span>
                          </Link>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className={`p-4 flex items-center gap-2 ${immersive ? 'border-t border-white/10' : 'border-t border-gray-100'}`}>
                <ZenSoundToggle immersive={immersive} />
                <CoinsBadge />
                <UserStatus immersive={immersive} />
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </nav>
  );
}
