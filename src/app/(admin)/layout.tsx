import { cookies } from 'next/headers';
import AdminLayoutShell from '@/components/admin/AdminLayoutShell';
import { getTenantConfig } from '@/lib/tenant-config-server';
import type { TenantContextValue } from '@/contexts/TenantContext';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // RSC 直读 tenant 配置（走 LRU 缓存），不再走客户端 /api/admin/tenant-config
  const tenantId = cookies().get('tenant_id')?.value ?? null;
  const fullConfig = await getTenantConfig(tenantId);

  const tenant: TenantContextValue = {
    id: fullConfig.id,
    name: fullConfig.name,
    slug: fullConfig.id,
    theme_config: fullConfig.theme,
    enabled_features: fullConfig.menuItems,
    ai_persona_prefix: fullConfig.aiPersonaPrefix,
    extra_config: fullConfig.extraConfig,
  };

  return <AdminLayoutShell tenant={tenant}>{children}</AdminLayoutShell>;
}
