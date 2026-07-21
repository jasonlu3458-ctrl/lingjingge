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

const menuItems = [
  {
    label: '解惑',
    href: '/wen',
    items: [
      { label: 'AI轻解忧', href: '/wen/light-solution', icon: '💡' },
      { label: 'AI易理师', href: '/wen/yi/yili', icon: '☯️' },
      { label: 'AI疗愈师', href: '/wen/liao/mind', icon: '💚' },
      { label: 'AI禅师',   href: '/wen/chan/ai-zen-master', icon: '🧘' },
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
      { label: '藏经阁',   href: '/zang/library', icon: '📚' },
      { label: '术语百科', href: '/zang/terms',   icon: '📖' },
      { label: '法脉源流', href: '/zang/lineage', icon: '📜' },
    ]
  },
  {
    label: '同修',
    href: '/tong/community',
    items: [
      { label: '同修社区', href: '/tong/community',  icon: '🤝' },
      { label: '每日话题', href: '/tong/daily-topic', icon: '☀️' },
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
      { label: '宠物起名', href: '/pet/naming', icon: '🐾' },
      { label: '积德行善', href: '/pet/liberation', icon: '🕊️' },
      { label: '吉祥饰品', href: '/pet/accessories', icon: '🔔' },
      { label: '饮食调理', href: '/pet/diet', icon: '🥣' },
    ]
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
    }, 150);
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
            <Link href="/home" prefetch={true} className="flex items-center gap-2 group">
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
            {menuItems.map((menu) => (
              <div
                key={menu.label}
                className="relative h-16 flex items-center"
                onMouseEnter={() => handleMenuEnter(menu.label)}
                onMouseLeave={handleMenuLeave}
                onFocus={() => handleMenuEnter(menu.label)}
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
                  <span className="transition-transform duration-300 text-xs" style={{
                    transform: activeMenu === menu.label ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>
                    ▼
                  </span>
                </Link>

                {activeMenu === menu.label && (
                  <div
                    className="absolute top-full left-0 w-full h-2"
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {activeMenu === menu.label && (
                  <div
                    className={`absolute top-full left-0 pt-2 rounded-lg shadow-xl border py-4 z-50 ${
                      immersive
                        ? 'bg-black/90 backdrop-blur-md border-white/15'
                        : 'bg-white border-gray-200'
                    }`}
                    style={{
                      animation: 'fadeInDown 0.2s ease-out',
                      minWidth: '280px',
                    }}
                    onMouseEnter={() => handleMenuEnter(menu.label)}
                    onMouseLeave={handleMenuLeave}
                  >
                    {menu.items.map((category) =>
                      'subItems' in category && Array.isArray((category as { subItems?: unknown[] }).subItems) ? (
                        <div key={category.label} className="mb-3 last:mb-0">
                          <div
                            className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                            style={{
                              fontFamily: "'Ma Shan Zheng', cursive, serif",
                              letterSpacing: '1px',
                            }}
                          >
                            {category.label}
                          </div>
                          {((category as { subItems: { href: string; label: string; icon?: string }[] }).subItems).map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              prefetch={true}
                              className={`flex items-center gap-3 px-4 py-2.5 text-sm mx-2 rounded-lg transition-all duration-200 ${
                                immersive
                                  ? 'text-white/85 hover:bg-white/10 hover:text-white'
                                  : 'text-gray-700 hover:bg-amber-50'
                              }`}
                              style={{
                                fontFamily: "'Ma Shan Zheng', cursive, serif",
                                letterSpacing: '1px',
                              }}
                            >
                              <span className="text-lg">{item.icon}</span>
                              <span>{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <Link
                          key={(category as { href: string }).href}
                          href={(category as { href: string }).href}
                          prefetch={true}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm mx-2 rounded-lg transition-all duration-200 ${
                            immersive
                              ? 'text-white/85 hover:bg-white/10 hover:text-white'
                              : 'text-gray-700 hover:bg-amber-50'
                          }`}
                          style={{
                            fontFamily: "'Ma Shan Zheng', cursive, serif",
                            letterSpacing: '1px',
                          }}
                        >
                          <span className="text-lg">{(category as { icon?: string }).icon}</span>
                          <span>{category.label}</span>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}

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
              {menuItems.map((menu) => (
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
                    <span
                      className={`transition-transform duration-300 ${
                        activeMenu === menu.label ? 'rotate-180' : ''
                      } ${immersive ? 'text-white/60' : ''}`}
                    >
                      ▼
                    </span>
                  </button>

                  {activeMenu === menu.label && (
                    <div
                      className={`px-2 py-2 animate-fadeIn ${
                        immersive ? 'bg-black/60' : 'bg-gray-50'
                      }`}
                    >
                      {menu.items.map((category) =>
                        'subItems' in category && Array.isArray((category as { subItems?: unknown[] }).subItems) ? (
                          <div key={category.label}>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                              {category.label}
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
                          key={(category as { href: string }).href}
                          href={(category as { href: string }).href}
                          prefetch={true}
                          className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors block w-full ${
                            immersive
                              ? 'text-white/85 hover:bg-white/10 hover:text-white'
                              : 'text-gray-700 hover:bg-white'
                          }`}
                        >
                            <span className="text-lg">{(category as { icon?: string }).icon}</span>
                            <span>{category.label}</span>
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
