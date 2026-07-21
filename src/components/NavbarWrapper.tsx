'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import MuxintangNavbar from './muxintang/MuxintangNavbar';
import { DEFAULT_TENANT_CONFIG } from '@/lib/tenant-config';

export default function NavbarWrapper() {
  const pathname = usePathname();
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  useEffect(() => {
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };
    setTenantId(getCookie('tenant_id'));
  }, []);
  
  if (!pathname) {
    return null;
  }
  
  if (pathname === '/') {
    return null;
  }
  
  if (pathname.startsWith('/muxintang')) {
    return null;
  }
  
  if (tenantId?.includes('muxintang')) {
    return (
      <MuxintangNavbar 
        menuItems={DEFAULT_TENANT_CONFIG.enabled_features}
        theme={DEFAULT_TENANT_CONFIG.theme_config}
        tenantName={DEFAULT_TENANT_CONFIG.name}
      />
    );
  }
  
  const immersive = ['/wen/chan/ai-zen-master'].some((p) => pathname === p || pathname.startsWith(p + '/'));
  
  return <Navbar immersive={immersive} />;
}