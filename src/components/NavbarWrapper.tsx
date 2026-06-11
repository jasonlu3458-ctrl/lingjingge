'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// 整个 Navbar 不参与 SSR，server/client 都输出 placeholder
const Navbar = dynamic(() => import('@/components/Navbar'), {
  ssr: false,
  loading: () => null,
});

export default function NavbarWrapper() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return <Navbar />;
}
