'use client';

import { useEffect, useState } from 'react';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import type { UserRole } from '@/lib/auth';
import dynamic from 'next/dynamic';

// ChatUI 客户端异步加载（不阻塞首屏静态壳）
const LifeCodePageClient = dynamic(() => import('./LifeCodePageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-sm text-gray-500" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
        🪷 加载中…
      </div>
    </div>
  ),
});

/**
 * 静态壳：标题 / 介绍 / 装饰由服务端预渲染，
 * 实际交互组件（LifeCodePageClient）通过 next/dynamic 异步加载。
 * 客户端 hydrate 后才检测登录态、加载 Dify → 首屏 LCP 极快。
 */
export default function LifeCodePageShell() {
  // 只在客户端检测登录状态（cookie-based），不影响 SSG
  const [mounted, setMounted] = useState(false);
  const isAuth = useIsAuthenticated();
  useEffect(() => { setMounted(true); }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fdfaf3] to-[#f5efe0]">
      {/* 静态壳：标题区（首屏立刻可见） */}
      <section className="px-4 pt-12 pb-6 max-w-3xl mx-auto text-center">
        <div className="text-5xl mb-4">🪷</div>
        <h1
          className="text-3xl md:text-4xl font-bold mb-3 text-[#5a3e1a]"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          AI 生命密码 · 天赋觉醒
        </h1>
        <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-xl mx-auto">
          看见自己本来的样子。AI 助你读懂性格、节律与潜在优势。
        </p>
        <p className="text-xs text-amber-700/80 mt-3" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          看清自己的剧本，才能写好下一章
        </p>
      </section>

      {/* 动态部分：hydrate 后挂载（首屏 LCP 不受 dynamic 加载阻塞） */}
      <section className="px-4 pb-16 max-w-3xl mx-auto">
        {mounted && (
          <LifeCodePageClient
            userRole={(isAuth ? 'free' : 'free') as UserRole /* 占位：客户端组件自行精化 */}
          />
        )}
        {!mounted && (
          <div className="muxintang-card p-8 max-w-2xl mx-auto">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse mt-6" />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
