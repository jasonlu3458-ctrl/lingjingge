'use client';

import Link from 'next/link';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import type { UserRole } from '@/lib/auth';

export interface ReportPaywallProps {
  /** 当前用户角色（'free' 表示未付费） */
  userRole: UserRole;
  /** 简本报告内容 */
  freePart: string;
  /** 完整报告内容（仅会员可见） */
  premiumPart: string;
  /** 完整报告包含的章节名（用于展示「会员可查看」清单） */
  premiumSections: string[];
  /** 报告标识（用于单次解锁支付参数） */
  reportKey: string;
  /** 完整版主题色，默认琥珀色 */
  accentClass?: string;
}

/**
 * 表单+报告类页面的统一付费墙
 *
 * 三态渲染：
 * - 会员    → 完整报告
 * - 已登录免费用户 → 简本 + 「升级会员」CTA
 * - 未登录访客    → 简本 + 「免费注册解锁」CTA
 */
export default function ReportPaywall({
  userRole,
  freePart,
  premiumPart,
  premiumSections,
  reportKey,
  accentClass = 'text-amber-300',
}: ReportPaywallProps) {
  const isAuthenticated = useIsAuthenticated();
  const isPaid = userRole === 'member' || userRole === 'admin';

  if (isPaid) {
    return (
      <>
        <div className="whitespace-pre-wrap">{freePart}</div>
        {premiumPart && (
          <div className="mt-4 bg-white rounded border border-green-200 p-4">
            <div className="text-green-600 text-sm font-medium mb-2">✅ 会员专属内容</div>
            <div className="whitespace-pre-wrap">{premiumPart}</div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="whitespace-pre-wrap">{freePart}</div>
      {premiumPart && (
        <div className="mt-4 p-4 border border-dashed border-gray-400 rounded bg-gray-50">
          <div className={`text-sm font-medium mb-2 ${accentClass}`}>🔒 完整报告仅对会员开放</div>
          <div className="text-sm text-gray-600 mb-3">
            会员可查看：{premiumSections.join('、')}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* 未登录访客：主推「免费注册」 */}
            {!isAuthenticated ? (
              <Link
                href={`/tong/signup?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`}
                className="flex-1 py-2 bg-[#b85a4a] text-white text-center rounded hover:bg-[#9a4a3a] transition-colors font-medium"
              >
                🎁 免费注册 · 解锁完整报告
              </Link>
            ) : (
              <>
                {/* 已登录免费用户：推单次解锁 + 升级会员 */}
                <button
                  onClick={() => {
                    window.location.href = `/api/create-checkout-session?type=single&report=${reportKey}`;
                  }}
                  className="flex-1 py-2 bg-white border border-[#2c2c2c] text-[#2c2c2c] rounded hover:bg-gray-50 transition-colors"
                >
                  单次解锁 · ¥9.9
                </button>
                <Link
                  href="/tong/pricing"
                  className="flex-1 py-2 bg-[#b85a4a] text-white text-center rounded hover:bg-[#9a4a3a] transition-colors"
                >
                  升级会员 · 全站解锁
                </Link>
              </>
            )}
          </div>
          <div className="text-xs text-gray-400 text-center mt-2">
            {!isAuthenticated
              ? '注册免费，注册后可继续体验其他工具'
              : '单次解锁仅限当前报告，会员可查看所有深度内容'}
          </div>
        </div>
      )}
    </>
  );
}
