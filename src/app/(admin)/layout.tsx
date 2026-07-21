import AdminSidebar from '@/components/admin/AdminSidebar';
import { getTenantConfig } from '@/lib/tenant';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const tenant = getTenantConfig();

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AdminSidebar tenantId={tenant.id || ''} tenantName={tenant.name || '灵境阁'} />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}