// ============================================================
// /guan/wealth —— 静态壳入口
// ------------------------------------------------------------
// 模式同 /guan/lifecode：服务端只渲染标题/介绍/装饰元素。
// 表单/测算/付费墙由 WealthPageClient 客户端异步加载。
// ============================================================

import nextDynamic from 'next/dynamic';
import type { UserRole } from '@/lib/auth';

const WealthPageClient = nextDynamic(() => import('./WealthPageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div
        className="text-sm text-stone-500 tracking-widest"
        style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
      >
        🪷 加载中…
      </div>
    </div>
  ),
});

export const metadata = {
  title: '事业智富 · 破局之道 · 灵境阁',
  description: '君子爱财，取之有道。算清格局，谋定后动 —— 一份基于先天格局的个人商业行动指南。',
};

export const dynamic = 'force-static';
export const revalidate = false;

export async function generateStaticParams() {
  return [{}];
}

export default function WealthPage() {
  // 静态壳：userRole 交由客户端在挂载后异步获取，build 时零阻塞
  return <WealthPageClient userRole={'free' as UserRole} />;
}
