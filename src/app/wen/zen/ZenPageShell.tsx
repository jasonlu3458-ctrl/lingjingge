// ============================================================
// ZenPageShell.tsx —— AI 禅师静态壳
// ------------------------------------------------------------
// 静态壳只负责：标题、副标题、布局容器。
// 动态交互（输入框 / 对话流 / 付费墙）由 ZenClient 异步加载。
// 这样 build 时可将该页标记为 ○ Static，首屏秒开。
// ============================================================

import dynamic from 'next/dynamic';

const ZenClient = dynamic(() => import('./ZenClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div
        className="text-sm text-white/35 tracking-[0.3em]"
        style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
      >
        🪷 静候中…
      </div>
    </div>
  ),
});

export default function ZenPageShell() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* 顶部静态标题（预渲染） */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-6 text-center">
        <h1
          className="text-4xl md:text-5xl text-white/90 mb-4"
          style={{
            fontFamily: "'Ma Shan Zheng', cursive, serif",
            letterSpacing: '0.15em',
            fontWeight: 400,
          }}
        >
          AI禅师 · 灵境
        </h1>
        <p
          className="text-white/40 text-base tracking-wider"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '0.1em' }}
        >
          机锋对答 · 静室无门
        </p>
      </div>

      {/* 动态内容（客户端异步加载） */}
      <ZenClient />
    </div>
  );
}
