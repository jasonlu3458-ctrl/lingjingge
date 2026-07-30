'use client';

import AdminSidebar from './AdminSidebar';
import { TenantProvider, type TenantContextValue } from '@/contexts/TenantContext';

interface AdminLayoutShellProps {
  tenant: TenantContextValue;
  children: React.ReactNode;
}

export default function AdminLayoutShell({ tenant, children }: AdminLayoutShellProps) {
  return (
    <TenantProvider value={tenant}>
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <AdminSidebar tenantId={tenant.id || ''} tenantName={tenant.name || '灵境阁'} />
        <main className="flex-1 ml-64 p-8">{children}</main>
      </div>
    </TenantProvider>
  );
}
