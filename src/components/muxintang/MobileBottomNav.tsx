'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { TenantThemeConfig } from '@/lib/tenant-config';

interface MobileBottomNavProps {
  theme?: TenantThemeConfig;
  extraConfig?: Record<string, boolean>;
}

export default function MobileBottomNav({ theme, extraConfig = {} }: MobileBottomNavProps) {
  const pathname = usePathname();

  const baseItems = [
    { label: '道场', href: '/muxintang', icon: '🏠' },
    { label: '智测', href: '/muxintang/tools', icon: '🔮' },
    { label: '专栏', href: '/muxintang/channel', icon: '📚' },
    { label: '故事', href: '/muxintang/learn', icon: '📖' },
    { label: '我的', href: '/muxintang/me', icon: '👤' },
  ];

  const featureItems = [];
  if (extraConfig.pet_zone) {
    featureItems.push({ label: '宠物', href: '/muxintang/pet', icon: '🐾' });
  }
  if (extraConfig.ai_wallpaper) {
    featureItems.push({ label: '壁纸', href: '/muxintang/wallpaper', icon: '🖼️' });
  }

  const navItems = [...baseItems, ...featureItems];

  const primaryColor = theme?.text_primary || '#D4AF37';
  const mutedColor = theme?.text_muted || '#808080';
  const bgDark = theme?.bg_dark || '#0a0a0a';
  const borderColor = theme?.border_color || '#333333';
  const primary = theme?.primary || '#8B4513';
  const gold = theme?.gold || '#D4AF37';

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t pb-safe"
      style={{ backgroundColor: `${bgDark}/98`, borderColor }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300"
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