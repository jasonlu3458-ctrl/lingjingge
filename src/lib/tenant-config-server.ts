// ============================================================
// src/lib/tenant-config-server.ts
// 服务端读取租户完整配置（theme / menu / extra / persona）
// ------------------------------------------------------------
//  - RSC 直接调用，避免客户端额外 fetch /api/admin/tenant-config
//  - 通过 LRUCache 缓存（key = tenantId），5 分钟 TTL
//  - tenants 表无 RLS，使用 service_role 读取
//  - 找不到租户或未配置 Supabase 时回退到 DEFAULT_TENANT_CONFIG
// ============================================================

import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { LRUCache } from './tenant-cache';
import {
  DEFAULT_TENANT_CONFIG,
  parseThemeConfig,
  parseEnabledFeatures,
  type TenantThemeConfig,
  type NavItem,
} from './tenant-config';

export interface FullTenantConfig {
  id: string;
  name: string;
  theme: TenantThemeConfig;
  menuItems: NavItem[];
  aiPersonaPrefix: string;
  extraConfig: Record<string, boolean>;
}

const cache = new LRUCache<FullTenantConfig>();

function fallbackConfig(tenantId: string | null): FullTenantConfig {
  return {
    id: tenantId || DEFAULT_TENANT_CONFIG.id,
    name: DEFAULT_TENANT_CONFIG.name,
    theme: DEFAULT_TENANT_CONFIG.theme_config,
    menuItems: DEFAULT_TENANT_CONFIG.enabled_features,
    aiPersonaPrefix: '',
    extraConfig: {},
  };
}

export async function getTenantConfig(tenantId: string | null | undefined): Promise<FullTenantConfig> {
  if (!tenantId) {
    return fallbackConfig(null);
  }

  // 命中且有效
  const cached = cache.get(tenantId);
  if (cached) return cached;

  // 已记录但为 null：跳过 DB 查询，直接用默认值
  if (cache.has(tenantId)) {
    return fallbackConfig(tenantId);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return fallbackConfig(tenantId);
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, theme_config, enabled_features, ai_persona_prefix, extra_config')
      .eq('id', tenantId)
      .single();

    if (error || !data) {
      // 显式缓存 null，防止反复击穿
      cache.set(tenantId, null);
      return fallbackConfig(tenantId);
    }

    const config: FullTenantConfig = {
      id: data.id,
      name: typeof data.name === 'string' ? data.name : DEFAULT_TENANT_CONFIG.name,
      theme: parseThemeConfig(data.theme_config),
      menuItems: parseEnabledFeatures(data.enabled_features),
      aiPersonaPrefix: typeof data.ai_persona_prefix === 'string' ? data.ai_persona_prefix : '',
      extraConfig:
        data.extra_config && typeof data.extra_config === 'object'
          ? (data.extra_config as Record<string, boolean>)
          : {},
    };

    cache.set(tenantId, config);
    return config;
  } catch {
    return fallbackConfig(tenantId);
  }
}

/**
 * 用于租户配置变更后主动失效缓存（API 写入时调用）。
 */
export function invalidateTenantConfig(tenantId: string): void {
  cache.delete(tenantId);
}
