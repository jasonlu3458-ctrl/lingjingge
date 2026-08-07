'use client';

import Link from 'next/link';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';

/**
 * 牧心堂工具页面守卫
 *
 * 在工具页面表单上方显示：
 * - 已登录用户：正常使用工具
 * - 未登录用户：显示登录引导卡片，不阻止使用但引导注册
 *
 * 用法：
 * <MuxintangToolGuard toolName="生命代码">
 *   <form>...</form>
 * </MuxintangToolGuard>
 */
export default function MuxintangToolGuard({
  toolName,
  children,
}: {
  toolName: string;
  children: React.ReactNode;
}) {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 未登录：显示登录引导 + 工具表单（不阻止使用，但引导登录）
  return (
    <>
      {/* 登录引导卡片 */}
      <div className="muxintang-card p-5 mb-6 border-[#D4AF37]/40">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🔐</span>
          <div>
            <h3
              className="text-lg font-semibold text-[#D4AF37]"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            >
              登录后体验更完整
            </h3>
            <p className="text-sm text-[#808080]">
              登录即可保存测算记录、获取深度解读
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/muxintang/register?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/muxintang')}`}
            className="flex-1 py-2.5 bg-[#D4AF37] text-black text-center rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
          >
            免费注册
          </Link>
          <Link
            href={`/muxintang/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/muxintang')}`}
            className="flex-1 py-2.5 border border-[#D4AF37]/50 text-[#D4AF37] text-center rounded-lg hover:bg-[#D4AF37]/10 transition-colors text-sm"
          >
            登录
          </Link>
        </div>
      </div>

      {/* 仍然显示工具表单（允许试用） */}
      <div className="opacity-90">
        {children}
      </div>

      {/* 底部再次引导 */}
      <div className="mt-6 text-center text-sm text-[#808080]">
        <p>
          ✦ {toolName} · 测算后{' '}
          <Link
            href={`/muxintang/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/muxintang')}`}
            className="text-[#D4AF37] hover:underline"
          >
            登录保存
          </Link>{' '}
         获取完整深度解读 ✦
        </p>
      </div>
    </>
  );
}
