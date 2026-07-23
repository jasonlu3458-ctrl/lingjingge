'use client';

import './globals.css';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MuxintangNavbar from '@/components/muxintang/MuxintangNavbar';
import MobileBottomNav from '@/components/muxintang/MobileBottomNav';
import PushSubscription from '@/components/muxintang/PushSubscription';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { 
  parseThemeConfig, 
  parseEnabledFeatures, 
  DEFAULT_TENANT_CONFIG, 
  buildThemeCSS,
  type TenantThemeConfig,
  type NavItem
} from '@/lib/tenant-config';

const AcharyaFloatingButton = dynamic(() => 
  import('@/components/muxintang/AcharyaFloatingButton').then(mod => ({ default: mod.AcharyaFloatingButton })), 
  { ssr: false }
);

interface LayoutConfig {
  theme: TenantThemeConfig;
  menuItems: NavItem[];
  tenantName: string;
  extraConfig: Record<string, boolean>;
}

async function fetchTenantConfig(): Promise<LayoutConfig> {
  try {
    const res = await fetch('/api/admin/tenant-config');
    const data = await res.json();
    
    if (data.success && data.data) {
      const d = data.data as any;
      const theme = parseThemeConfig(d.theme_config);
      const menuItems = parseEnabledFeatures(d.enabled_features);
      const tenantName = typeof d.name === 'string' ? d.name : DEFAULT_TENANT_CONFIG.name;
      const extraConfig = typeof d.extra_config === 'object' ? d.extra_config : {};
      return { theme, menuItems, tenantName, extraConfig };
    }
  } catch {
    // API fetch failed, fall back to defaults
  }

  return {
    theme: DEFAULT_TENANT_CONFIG.theme_config,
    menuItems: DEFAULT_TENANT_CONFIG.enabled_features,
    tenantName: DEFAULT_TENANT_CONFIG.name,
    extraConfig: {},
  };
}

export default function MuxintangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<LayoutConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isHydrated = useRef(false);

  useEffect(() => {
    isHydrated.current = true;
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchTenantConfig().then((result) => {
      if (mounted) {
        setConfig(result);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { theme, menuItems, tenantName, extraConfig } = config;
  const themeCSS = buildThemeCSS(theme);

  return (
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
  );
}
