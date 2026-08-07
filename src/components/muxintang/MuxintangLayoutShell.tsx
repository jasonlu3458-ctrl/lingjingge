'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MuxintangNavbar from './MuxintangNavbar';
import MobileBottomNav from './MobileBottomNav';
import PushSubscription from './PushSubscription';
import { buildThemeCSS, type NavItem, type TenantThemeConfig } from '@/lib/tenant-config';
import { TenantProvider, type TenantContextValue } from '@/contexts/TenantContext';
import ZenSoundToggle from '@/components/ZenSoundToggle';

const UniversalAIHelper = dynamic(
  () => import('@/components/shared/UniversalAIHelper'),
  { ssr: false, loading: () => null }
);

export interface MuxintangLayoutConfig {
  id: string;
  name: string;
  theme: TenantThemeConfig;
  menuItems: NavItem[];
  extraConfig: Record<string, boolean>;
  aiPersonaPrefix: string;
}

interface MuxintangLayoutShellProps {
  config: MuxintangLayoutConfig;
  children: React.ReactNode;
}

export default function MuxintangLayoutShell({ config, children }: MuxintangLayoutShellProps) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const { name: tenantName, theme, menuItems, extraConfig, aiPersonaPrefix } = config;
  const themeCSS = buildThemeCSS(theme);

  // ✨ 首页背景透明，让星空显示；其他页面使用主题背景色
  // 不依赖 isHydrated，避免 SSR 和客户端首次渲染不一致
  const isHomePage = pathname === '/muxintang';

  // 喂给 Context：shape 与历史 /api/admin/tenant-config 响应保持一致
  const tenantValue: TenantContextValue = {
    id: config.id,
    name: config.name,
    slug: config.id,
    theme_config: theme,
    enabled_features: menuItems,
    ai_persona_prefix: aiPersonaPrefix,
    extra_config: extraConfig,
  };

  return (
    <TenantProvider value={tenantValue}>
      <div 
        className="min-h-screen flex flex-col transition-colors duration-300"
        style={{ backgroundColor: isHomePage ? 'transparent' : theme.bg_dark }}
      >
        <style>{themeCSS}</style>
        <MuxintangNavbar
          menuItems={menuItems}
          theme={theme}
          tenantName={tenantName}
          extraConfig={extraConfig}
        />
        <main className="flex-1 pt-16 pb-20">
          {isHydrated ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          ) : (
            <>{children}</>
          )}
        </main>
        <PushSubscription />
        <MobileBottomNav theme={theme} extraConfig={extraConfig} menuItems={menuItems} />
        <UniversalAIHelper role="muxintang" />
        {/* 禅音背景音乐开关：左下角浮按，与右侧阿阇梨浮按对称 */}
        <div className="fixed bottom-20 md:bottom-6 left-6 z-40">
          <ZenSoundToggle immersive />
        </div>
        <footer
          className="hidden md:block border-t py-6"
          style={{ backgroundColor: theme.bg_card, borderColor: theme.border_color }}
        >
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-sm" style={{ color: theme.text_muted }}>
              {tenantName} · 心之所向，牧之以道
            </p>
          </div>
        </footer>
      </div>
    </TenantProvider>
  );
}
