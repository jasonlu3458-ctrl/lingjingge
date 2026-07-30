// ============================================================
// src/contexts/TenantContext.tsx
// 牧心堂 / 后台管理 共享的租户数据 Context
// ------------------------------------------------------------
//  - 顶层 RSC layout 通过 getTenantConfig() 拿到完整租户配置
//  - 通过 MuxintangLayoutShell / AdminLayoutShell 注入 Provider
//  - 任意客户端子组件可用 useTenant() 直接读取
//  - shape 与历史 /api/admin/tenant-config 返回值兼容，避免大改
// ============================================================

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { TenantThemeConfig, NavItem } from '@/lib/tenant-config';

export interface TenantContextValue {
  id: string;
  name: string;
  slug: string;
  theme_config: TenantThemeConfig;
  enabled_features: NavItem[];
  ai_persona_prefix: string;
  extra_config: Record<string, boolean>;
}

export const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: TenantContextValue;
}) {
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
