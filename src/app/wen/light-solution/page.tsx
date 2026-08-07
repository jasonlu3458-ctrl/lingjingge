// ============================================================
// LightSolutionPageShell —— 解忧师静态壳
// ------------------------------------------------------------
// 静态壳只负责 SEO 元数据 + 标题/副标题渲染。
// 动态内容（用户角色、对话流、付费墙）由 LightSolutionClient
// 通过 next/dynamic 异步加载，实现秒开 + SEO 友好。
// ============================================================

import nextDynamic from 'next/dynamic';
import { getUserRole } from '@/lib/auth';
import type { UserRole } from '@/lib/auth';

const LightSolutionClient = nextDynamic(() => import('./LightSolutionClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div
        className="text-sm text-stone-500 tracking-widest"
        style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
      >
        🪷 解忧师准备中…
      </div>
    </div>
  ),
});

export const metadata = {
  title: '解忧师 · 灵境阁',
  description: '说一句你现在的烦恼，让 AI 陪你理一理。3 轮免费陪伴。',
};

export default async function LightSolutionPage() {
  // 用户角色虽然来自服务端，但 light-solution 是强交互场景，
  // 这里用 force-static 预渲染壳，客户端再异步获取 userRole 即可。
  // 为保持零阻塞，shell 不再 await getUserRole（避免 build 时的 auth 调用）。
  // 角色判断完全由客户端在挂载后读取。
  return <LightSolutionClient userRole={'free' as UserRole} />;
}

export const dynamic = 'force-static';
export const revalidate = false;
