import type { TenantConfig } from './tenant';

export function getTenantConfigClient(): TenantConfig {
  if (typeof document === 'undefined') {
    return {
      id: null,
      name: null,
      logoUrl: null,
      primaryColor: null,
      aiPersonaPrefix: null,
    };
  }
  const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  };
  return {
    id: getCookie('tenant_id'),
    name: getCookie('tenant_name'),
    logoUrl: getCookie('tenant_logo_url'),
    primaryColor: getCookie('tenant_primary_color'),
    aiPersonaPrefix: getCookie('tenant_ai_persona_prefix'),
  };
}
