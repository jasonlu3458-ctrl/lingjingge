'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { NavItem, TenantThemeConfig } from '@/lib/tenant-config';
import { withAlpha } from '@/lib/tenant-config';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';

interface MuxintangNavbarProps {
  menuItems: NavItem[];
  theme?: TenantThemeConfig;
  tenantName?: string;
  extraConfig?: Record<string, boolean>;
}

export default function MuxintangNavbar({
  menuItems,
  theme,
  tenantName = '牧心堂',
  extraConfig = {},
}: MuxintangNavbarProps) {
  const pathname = usePathname();
  const isAuthenticated = useIsAuthenticated();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHomePage = pathname === '/muxintang';
  const [navbarVisible, setNavbarVisible] = useState(false);

  useEffect(() => {
    if (!isHomePage) return;
    const handleScroll = () => setNavbarVisible(window.scrollY > 100);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const primaryColor = theme?.text_primary || '#D4AF37';
  const secondaryColor = theme?.text_secondary || '#C0C0C0';
  const borderColor = theme?.border_color || '#333333';
  const bgDark = theme?.bg_dark || '#0a0a0a';

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
    setMobileMenuOpen((prev) => !prev);
    setActiveMenu(null);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setActiveMenu(null);
  }, []);

  const hasChildren = (item: NavItem) => Array.isArray(item.children) && item.children.length > 0;

  const renderDesktopMenuItem = (item: NavItem) => {
    const isActive =
      pathname === item.href || pathname.startsWith(item.href + '/');
    const hasSub = hasChildren(item);
    const isOpen = activeMenu === item.label;

    return (
      <div
        key={item.label}
        className="relative h-16 flex items-center"
        onMouseEnter={() => hasSub && handleMenuEnter(item.label)}
        onMouseLeave={handleMenuLeave}
        onFocus={() => hasSub && handleMenuEnter(item.label)}
        onBlur={handleMenuLeave}
      >
        <Link
          href={item.href}
          className="px-4 py-2.5 rounded-[20px] font-medium transition-all duration-300 flex items-center gap-1.5"
          style={{
            backgroundColor: isOpen ? withAlpha(primaryColor, 0.12) : 'transparent',
            color: isActive || isOpen ? primaryColor : secondaryColor,
            border: `1px solid ${isOpen ? withAlpha(primaryColor, 0.4) : 'transparent'}`,
            fontFamily: "'Ma Shan Zheng', cursive, serif",
            letterSpacing: '1px',
            fontSize: '15px',
          }}
        >
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
          {hasSub && (
            <span
              className="transition-transform duration-300 text-xs"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                color: isOpen ? primaryColor : secondaryColor,
              }}
            >
              ▼
            </span>
          )}
        </Link>

        {isOpen && hasSub && (
          <div
            className="absolute top-full left-0 w-full h-2 z-50"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {isOpen && hasSub && (
          <div
            className="absolute top-full left-0 rounded-lg shadow-xl border py-4 z-50"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.96)',
              backdropFilter: 'blur(12px)',
              borderColor: withAlpha(primaryColor, 0.3),
              minWidth: '220px',
              boxShadow: `0 12px 28px ${withAlpha(bgDark, 0.8)}, 0 4px 8px ${withAlpha(bgDark, 0.4)}`,
              animation: 'muxintangFadeInDown 0.18s ease-out',
            }}
            onMouseEnter={() => handleMenuEnter(item.label)}
            onMouseLeave={handleMenuLeave}
          >
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                prefetch={true}
                className="flex items-center gap-3 px-4 py-2.5 text-sm mx-2 rounded-md transition-all duration-200 whitespace-nowrap"
                style={{
                  color:
                    pathname === child.href || pathname.startsWith(child.href + '/')
                      ? primaryColor
                      : 'rgba(255,255,255,0.8)',
                  fontFamily: "'Ma Shan Zheng', cursive, serif",
                  letterSpacing: '1px',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = withAlpha(primaryColor, 0.1);
                  (e.currentTarget as HTMLElement).style.color = primaryColor;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
                }}
              >
                {child.icon && <span className="text-lg leading-none">{child.icon}</span>}
                <span>{child.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes muxintangFadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes muxintangSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${
          isHomePage && !navbarVisible ? '-translate-y-full' : 'translate-y-0'
        }`}
        style={{
          backgroundColor: withAlpha(bgDark, isHomePage ? 0.6 : 0.95),
          borderColor,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center h-16">
            {/* 左侧：Logo 区域 */}
            <Link
              href="/muxintang"
              className="flex items-center gap-3 cursor-pointer shrink-0"
              onClick={(e) => {
                if (isHomePage) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ backgroundColor: primaryColor, color: bgDark }}
              >
                心
              </div>
              <span
                className="font-bold text-xl tracking-wider"
                style={{ color: primaryColor }}
              >
                {tenantName}
              </span>
            </Link>

            {/* 中间：菜单项（居中） */}
            <div className="hidden md:flex flex-1 items-center justify-center gap-1">
              {menuItems.map((item) => renderDesktopMenuItem(item))}
            </div>

            {/* 右侧：登录/注册按钮 */}
            <div className="hidden md:flex items-center gap-4 shrink-0">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/muxintang/register"
                    className="text-sm font-medium transition-all duration-300"
                    style={{ color: secondaryColor }}
                  >
                    注册
                  </Link>
                  <Link
                    href="/muxintang/login"
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:opacity-90"
                    style={{
                      backgroundColor: primaryColor,
                      color: bgDark,
                    }}
                  >
                    登录
                  </Link>
                </>
              ) : (
                <Link
                  href="/muxintang/me"
                  className="text-sm font-medium transition-all duration-300"
                  style={{ color: secondaryColor }}
                >
                  👤 我的道场
                </Link>
              )}
            </div>

            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden p-2 ml-auto"
              style={{ color: primaryColor }}
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* 移动端菜单面板 */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={closeMobileMenu}
          />
        )}

        {mobileMenuOpen && (
          <div
            className="md:hidden pb-4 relative z-50"
            style={{ animation: 'muxintangSlideDown 0.2s ease-out' }}
          >
            <div
              className="rounded-b-xl overflow-hidden"
              style={{
                backgroundColor: 'rgba(20,20,20,0.98)',
                backdropFilter: 'blur(12px)',
                borderTop: `1px solid ${borderColor}`,
              }}
            >
              <div className="flex justify-end p-2">
                <button
                  onClick={closeMobileMenu}
                  aria-label="关闭菜单"
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-2xl transition-all duration-150 active:scale-95"
                  style={{ color: secondaryColor }}
                >
                  ✕
                </button>
              </div>
              {menuItems.map((item) => {
                const hasSub = hasChildren(item);
                const isOpen = activeMenu === item.label;
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <div
                    key={item.label}
                    className="last:border-b-0"
                    style={{ borderBottom: `1px solid ${borderColor}` }}
                  >
                    <button
                      className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors"
                      style={{
                        color: isActive ? primaryColor : 'rgba(255,255,255,0.85)',
                        fontFamily: "'Ma Shan Zheng', cursive, serif",
                      }}
                      onClick={() => {
                        if (hasSub) {
                          setActiveMenu(isOpen ? null : item.label);
                        } else {
                          closeMobileMenu();
                        }
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {item.icon && <span>{item.icon}</span>}
                        <span>{item.label}</span>
                      </span>
                      {hasSub && (
                        <span
                          className={`transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          style={{ color: secondaryColor }}
                        >
                          ▼
                        </span>
                      )}
                    </button>

                    {hasSub && isOpen && (
                      <div
                        className="px-4 py-2"
                        style={{
                          animation: 'muxintangFadeInDown 0.15s ease-out',
                        }}
                      >
                        {item.children!.map((child) => {
                          const childActive =
                            pathname === child.href ||
                            pathname.startsWith(child.href + '/');
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              prefetch={true}
                              onClick={closeMobileMenu}
                              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors block w-full"
                              style={{
                                color: childActive
                                  ? primaryColor
                                  : 'rgba(255,255,255,0.8)',
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = withAlpha(primaryColor, 0.08);
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                              }}
                            >
                              {child.icon && <span className="text-lg">{child.icon}</span>}
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              <div
                className="p-4 flex items-center gap-2"
                style={{ borderTop: `1px solid ${borderColor}` }}
              >
                {!isAuthenticated ? (
                  <>
                    <Link
                      href="/muxintang/register"
                      onClick={closeMobileMenu}
                      className="flex-1 py-2 text-sm text-center rounded-lg border transition-all"
                      style={{
                        color: secondaryColor,
                        borderColor: borderColor,
                      }}
                    >
                      注册
                    </Link>
                    <Link
                      href="/muxintang/login"
                      onClick={closeMobileMenu}
                      className="flex-1 py-2 text-sm text-center rounded-lg font-medium"
                      style={{
                        backgroundColor: primaryColor,
                        color: bgDark,
                      }}
                    >
                      登录
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/muxintang/me"
                    onClick={closeMobileMenu}
                    className="flex-1 py-2 text-sm text-center rounded-lg font-medium"
                    style={{
                      backgroundColor: primaryColor,
                      color: bgDark,
                    }}
                  >
                    👤 我的道场
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
