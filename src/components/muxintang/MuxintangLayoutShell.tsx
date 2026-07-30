'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MuxintangNavbar from './MuxintangNavbar';
import MobileBottomNav from './MobileBottomNav';
import PushSubscription from './PushSubscription';
import { buildThemeCSS, type NavItem, type TenantThemeConfig } from '@/lib/tenant-config';
import { TenantProvider, type TenantContextValue } from '@/contexts/TenantContext';
import ZenSoundToggle from '@/components/ZenSoundToggle';

const AcharyaFloatingButton = dynamic(
  () => import('./AcharyaFloatingButton').then((mod) => ({ default: mod.AcharyaFloatingButton })),
  { ssr: false }
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
  const isHydrated = useRef(false);

  useEffect(() => {
    isHydrated.current = true;
  }, []);

  const { name: tenantName, theme, menuItems, extraConfig, aiPersonaPrefix } = config;
  const themeCSS = buildThemeCSS(theme);

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
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.bg_dark }}>
        <style>{themeCSS}</style>
        <MuxintangNavbar
          menuItems={menuItems}
          theme={theme}
          tenantName={tenantName}
          extraConfig={extraConfig}
        />
        <main className="flex-1 pt-16 pb-20">
          {isHydrated.current ? (
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
        <MobileBottomNav theme={theme} extraConfig={extraConfig} />
        <AcharyaFloatingButton />
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
            <p className="text-xs mt-2" style={{ color: theme.text_muted }}>
              本平台内容仅供传统文化交流与娱乐参考
            </p>
          </div>
        </footer>
      </div>
    </TenantProvider>
  );
}
