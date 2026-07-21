'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  tenantId: string;
  tenantName: string;
}

const menuItems = [
  { label: '数据看板', href: '/admin', icon: '📊' },
  { label: '道场配置', href: '/admin/settings', icon: '⚙️' },
  { label: '三密法门', href: '/admin/three-secrets', icon: '🧘' },
  { label: '功能市场', href: '/admin/features', icon: '🧩' },
  { label: '内容管理', href: '/admin/content', icon: '📝' },
  { label: '商品管理', href: '/admin/products', icon: '🛒' },
  { label: '订单管理', href: '/admin/orders', icon: '📋' },
  { label: '创作者管理', href: '/admin/creators', icon: '👤' },
  { label: '海报生成', href: '/admin/poster-generator', icon: '🎨' },
  { label: '长文生成', href: '/admin/long-article', icon: '📚' },
];

export default function AdminSidebar({ tenantId, tenantName }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0a0a0a] border-r border-[#333333] z-50">
      <div className="p-6 border-b border-[#333333]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B4513] to-[#D4AF37] flex items-center justify-center">
            <span className="text-white text-lg">阁</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              {tenantName}
            </h1>
            <p className="text-xs text-[#808080]">管理后台</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#8B4513]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                      : 'text-[#C0C0C0] hover:bg-[#1a1a1a] hover:text-[#D4AF37]'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-6 left-0 right-0 p-4 border-t border-[#333333]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-[#242424] flex items-center justify-center">
            <span className="text-[#808080]">👤</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#C0C0C0] truncate">管理员</p>
            <p className="text-xs text-[#808080]">{tenantId}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}