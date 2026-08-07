// ============================================================
// /guan/lifecode —— 静态壳入口
// ------------------------------------------------------------
// 模式同 /wen/zen：
//   1) force-static + generateStaticParams 标记为预生成
//   2) 仅 metadata 是 SSG 必须（首屏 SEO，标题共享 tool-configs）
//   3) 表单 / 测算 / ChatUI 由 LifeCodePageClient 客户端异步加载
// ============================================================

import { getToolConfig } from '@/lib/tool-configs';
import LifeCodePageShell from './LifeCodePageShell';

export const metadata = {
  // 配置驱动：标题来自共享配置（与牧心堂 /muxintang/tools/bazi 共用）
  title: `${getToolConfig('lifecode')?.titleMain ?? 'AI 生命密码'} · 灵境阁`,
  description: getToolConfig('lifecode')?.description ?? '看见自己本来的样子。',
};

/**
 * 静态预生成（SSG）：本页面不依赖任何用户态数据
 * - 标题 / 介绍 / 表单壳 / ChatUI 全部走客户端异步加载
 * - 仅 metadata 是 SSG 必须的（首屏 SEO）
 */
export const dynamic = 'force-static';
export const revalidate = false;

export async function generateStaticParams() {
  // 工具页是单实例；不依赖路径参数 → 永远生成 1 个静态壳
  return [{}];
}

export default function LifeCodePage() {
  return <LifeCodePageShell />;
}
