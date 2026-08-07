'use client';

import Link from 'next/link';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import type { UserRole } from '@/lib/auth';

export interface MuxintangPaywallProps {
  /** 当前用户角色 */
  userRole?: UserRole;
  /** 免费部分内容 */
  freePart?: string;
  /** 付费部分内容（仅会员可见） */
  premiumPart?: string;
  /** 会员可查看的章节名 */
  premiumSections?: string[];
  /** 报告标识（用于单次解锁） */
  reportKey?: string;
  /** 预览内容 */
  previewContent?: string;
}

/**
 * 牧心堂专属付费墙组件（暗色主题）
 *
 * 与灵境阁 ReportPaywall 逻辑对齐，但：
 * - 视觉适配牧心堂 #0a0a0a + #D4AF37 金色暗色主题
 * - 登录跳转 /muxintang/login，注册跳转 /muxintang/register
 * - 升级会员跳转 /muxintang/pricing
 */
export default function MuxintangPaywall({
  userRole = 'free',
  freePart = '',
  premiumPart = '',
  premiumSections = [],
  reportKey = '',
  previewContent = '',
}: MuxintangPaywallProps) {
  const isAuthenticated = useIsAuthenticated();
  const isPaid = userRole === 'member' || userRole === 'admin' || userRole === 'acharya';

  // 会员：显示完整内容
  if (isPaid) {
    return (
      <>
        {freePart && <div className="whitespace-pre-wrap text-[#C0C0C0]">{freePart}</div>}
        {premiumPart && (
          <div className="mt-4 p-4 rounded-xl border border-[#D4AF37]/30 bg-[#1a1a1a]">
            <div className="text-[#D4AF37] text-sm font-medium mb-2">✅ 会员专属内容</div>
            <div className="whitespace-pre-wrap text-[#C0C0C0]">{premiumPart}</div>
          </div>
        )}
      </>
    );
  }

  // 免费用户/未登录：显示免费部分 + 付费墙
  return (
    <>
      {freePart && <div className="whitespace-pre-wrap text-[#C0C0C0]">{freePart}</div>}

      {premiumPart && (
        <div className="mt-4 p-5 rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#1a1a1a]/80">
          <div className="text-sm font-medium mb-3 text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            🔒 完整解读仅对会员开放
          </div>

          {/* 预览内容 */}
          {previewContent && (
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20">
              <div className="text-[10px] tracking-widest text-[#D4AF37]/80 mb-1.5 uppercase">✦ 报告预览</div>
              <div className="text-sm text-[#C0C0C0] leading-relaxed whitespace-pre-wrap italic line-clamp-6">
                {previewContent}
              </div>
              <div className="mt-2 text-[10px] text-[#808080] text-right">
                以上为预览内容 · 解锁后获取完整深度报告
              </div>
            </div>
          )}

          {premiumSections.length > 0 && (
            <div className="text-sm text-[#808080] mb-3">
              会员可查看：{premiumSections.join('、')}
            </div>
          )}

          {/* 价格卡片 */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-lg border border-[#333333] bg-[#242424] p-3 text-center">
              <div className="text-xs text-[#808080]">单次解锁</div>
              <div className="text-2xl font-bold text-[#C0C0C0] mt-1">¥9.9</div>
              <div className="text-[10px] text-[#555555] mt-0.5">仅限本报告</div>
            </div>
            <div className="rounded-lg border-2 border-[#D4AF37]/50 bg-[#D4AF37]/10 p-3 text-center relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-0.5 rounded">
                推荐
              </div>
              <div className="text-xs text-[#D4AF37]">月度会员</div>
              <div className="text-2xl font-bold text-[#D4AF37] mt-1">¥29.9<span className="text-xs">/月</span></div>
              <div className="text-[10px] text-[#D4AF37]/70 mt-0.5">全站工具全解锁</div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-2">
            {!isAuthenticated ? (
              <>
                <Link
                  href={`/muxintang/register?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/muxintang')}`}
                  className="flex-1 py-2.5 bg-[#D4AF37] text-black text-center rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  🎁 免费注册 · 解锁完整报告
                </Link>
                <Link
                  href={`/muxintang/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/muxintang')}`}
                  className="flex-1 py-2.5 border border-[#D4AF37]/50 text-[#D4AF37] text-center rounded-lg hover:bg-[#D4AF37]/10 transition-colors text-sm"
                >
                  已有账户 · 登录
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (reportKey) {
                      window.location.href = `/api/create-checkout-session?type=single&report=${reportKey}`;
                    }
                  }}
                  className="flex-1 py-2.5 border border-[#333333] text-[#C0C0C0] rounded-lg hover:bg-[#242424] transition-colors text-sm"
                >
                  单次解锁 · ¥9.9
                </button>
                <Link
                  href="/muxintang/pricing"
                  className="flex-1 py-2.5 bg-[#D4AF37] text-black text-center rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  升级会员 · 全站解锁
                </Link>
              </>
            )}
          </div>

          <div className="text-xs text-[#808080] text-center mt-2">
            {!isAuthenticated
              ? '注册免费，注册后可继续体验其他工具'
              : '单次解锁仅限当前报告，会员可查看所有深度内容'}
          </div>

          {/* 信任徽标 */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-[#808080]">
            <div>
              <div className="text-base">🛡️</div>
              <div>支付由 Polar 保障</div>
            </div>
            <div>
              <div className="text-base">🔒</div>
              <div>先天格局本地计算</div>
            </div>
            <div>
              <div className="text-base">↩️</div>
              <div>7 天无理由退款</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
