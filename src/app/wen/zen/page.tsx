// ============================================================
// /wen/zen —— 静态壳入口
// ------------------------------------------------------------
// 模式同 /guan/lifecode：
//   1) force-static + generateStaticParams 标记为预生成
//   2) 仅 metadata 是 SSG 必须（首屏 SEO）
//   3) 交互 / 对话流 / 付费墙由 ZenClient 客户端异步加载
// ============================================================

import ZenPageShell from './ZenPageShell';

export const metadata = {
  title: 'AI禅师 · 灵境',
  description: '机锋对答，静室无门。一段禅意对答的入口。',
};

/**
 * 静态预生成（SSG）：本页不依赖任何用户态数据
 * - 标题 / 介绍走 SSG
 * - ChatUI / 输入框 / 付费墙由 ZenClient 客户端异步加载
 */
export const dynamic = 'force-static';
export const revalidate = false;

export async function generateStaticParams() {
  // 工具页是单实例；不依赖路径参数 → 永远生成 1 个静态壳
  return [{}];
}

export default function ZenPage() {
  return <ZenPageShell />;
}
