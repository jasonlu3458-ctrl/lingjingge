'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { NavItem, TenantThemeConfig } from '@/lib/tenant-config';
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
  extraConfig = {}
}: MuxintangNavbarProps) {
  const pathname = usePathname();
  const isAuthenticated = useIsAuthenticated();
  
  const primaryColor = theme?.text_primary || '#D4AF37';
  const secondaryColor = theme?.text_secondary || '#C0C0C0';
  const borderColor = theme?.border_color || '#333333';
  const bgDark = theme?.bg_dark || '#0a0a0a';
  const goldStart = theme?.gold || '#D4AF37';
  const primaryStart = theme?.primary || '#8B4513';

  return (
    <>
      <style>{`
        .muxintang-nav-link:hover {
          color: ${primaryColor} !important;
        }
      `}</style>
      <nav 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
        style={{ backgroundColor: `${bgDark}/95`, borderColor }}
      >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/muxintang" className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(to bottom right, ${goldStart}, ${primaryStart})` }}
            >
              <span className="font-bold text-lg" style={{ color: bgDark }}>
                {tenantName.charAt(0)}
              </span>
            </div>
            <span 
              className="font-bold text-xl tracking-wider"
              style={{ color: primaryColor }}
            >
              {tenantName}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="muxintang-nav-link text-sm font-medium transition-all duration-300 relative"
                  style={{ 
                    color: isActive ? primaryColor : secondaryColor,
                  }}
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                  {isActive && (
                    <span 
                      className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                      style={{ backgroundColor: primaryColor }}
                    />
                  )}
                </Link>
              );
            })}
            
            {!isAuthenticated ? (
              <>
                <Link
                  href="/muxintang/register"
                  className="muxintang-nav-link text-sm font-medium transition-all duration-300"
                  style={{ color: secondaryColor }}
                >
                  注册
                </Link>
                <Link
                  href="/muxintang/login"
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300"
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
                className="muxintang-nav-link text-sm font-medium transition-all duration-300"
                style={{ color: secondaryColor }}
              >
                👤 我的道场
              </Link>
            )}
          </div>

          <button 
            className="md:hidden p-2"
            style={{ color: primaryColor }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
    </>
  );
}