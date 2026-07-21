import { cookies } from 'next/headers';

export interface TenantConfig {
  id: string | null;
  name: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  aiPersonaPrefix: string | null;
}

export function getTenantConfig(): TenantConfig {
  const cookieStore = cookies();
  return {
    id: cookieStore.get('tenant_id')?.value || null,
    name: cookieStore.get('tenant_name')?.value || null,
    logoUrl: cookieStore.get('tenant_logo_url')?.value || null,
    primaryColor: cookieStore.get('tenant_primary_color')?.value || null,
    aiPersonaPrefix: cookieStore.get('tenant_ai_persona_prefix')?.value || null,
  };
}