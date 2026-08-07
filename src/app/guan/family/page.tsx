// ============================================================
// /guan/family —— 静态壳入口
// ============================================================

import nextDynamic from 'next/dynamic';
import type { UserRole } from '@/lib/auth';

const FamilyPageClient = nextDynamic(() => import('./FamilyPageClient'), {
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
  title: 'AI 婚姻家庭 · 灵境阁',
  description: '解结化怨，重建亲密。看清关系里那些没说出口的话。',
};

export const dynamic = 'force-static';
export const revalidate = false;

export async function generateStaticParams() {
  return [{}];
}

export default function FamilyPage() {
  return <FamilyPageClient userRole={'free' as UserRole} />;
}
