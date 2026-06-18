'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

// 注：之前用 next/dynamic({ ssr:false }) 把 Navbar 拆成独立 chunk，
// 在 dev 模式下触发 webpack 切分时丢 factory 的 bug
// (options.factory === undefined → originalFactory.call 抛错)，
// 表现为整页 hydration 失败。这里直接静态导入，chunk 不再被切分。
//
// 沉浸式页面（禅意深色背景）名单：导航栏转为半透明 / 滚动后纯黑
const IMMERSIVE_PATHS = ['/wen/chan/ai-zen-master'];

export default function NavbarWrapper() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  const immersive = IMMERSIVE_PATHS.some((p) => pathname === p || pathname?.startsWith(p + '/'));
  return <Navbar immersive={immersive} />;
}
