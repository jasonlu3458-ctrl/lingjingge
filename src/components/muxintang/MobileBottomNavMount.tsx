'use client';

import dynamic from 'next/dynamic';

const MobileBottomNav = dynamic(
  () => import('./MobileBottomNav').then((mod) => ({ default: mod.default })),
  { ssr: false }
);

/**
 * 客户端壳：把 MobileBottomNav（next/dynamic ssr:false）暴露给根布局使用。
 */
export default function MobileBottomNavMount() {
  return <MobileBottomNav />;
}
