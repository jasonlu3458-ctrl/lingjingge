'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const pathname = usePathname();

  // 首页不显示导航栏
  if (pathname === '/') {
    return null;
  }

  // 牧心堂路径使用专属导航
  if (pathname?.startsWith('/muxintang')) {
    return null;
  }

  return <Navbar />;
}
