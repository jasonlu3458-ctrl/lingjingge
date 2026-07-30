import './globals.css';
import { cookies } from 'next/headers';
import MuxintangLayoutShell from '@/components/muxintang/MuxintangLayoutShell';
import { getTenantConfig } from '@/lib/tenant-config-server';

export const dynamic = 'force-dynamic';

export default async function MuxintangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantId = cookies().get('tenant_id')?.value ?? null;
  const fullConfig = await getTenantConfig(tenantId);

  const config = {
    id: fullConfig.id,
    name: fullConfig.name,
    theme: fullConfig.theme,
    menuItems: fullConfig.menuItems,
    extraConfig: fullConfig.extraConfig,
    aiPersonaPrefix: fullConfig.aiPersonaPrefix,
  };

  return <MuxintangLayoutShell config={config}>{children}</MuxintangLayoutShell>;
}
