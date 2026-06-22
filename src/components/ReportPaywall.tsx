'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import { useConsent } from '@/hooks/useConsent';
import ConsentModal from './ConsentModal';
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
  const { hasConsented, giveConsent, hydrated } = useConsent();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);
  const isPaid = userRole === 'member' || userRole === 'admin';

  /**
   * 关键行为前确认：已同意 → 直接放行；未同意 → 弹弹窗，同意后再放行
   * @param action 实际的解锁/支付动作
   */
  const guarded = (action: () => void) => {
    if (!hydrated) return; // 等 localStorage 读取完成
    if (hasConsented) {
      action();
    } else {
      setPendingAction(() => action);
      setShowConsentModal(true);
    }
  };

  const handleConfirm = () => {
    giveConsent();
    setShowConsentModal(false);
    if (pendingAction) {
      const a = pendingAction;
      setPendingAction(null);
      a();
    }
  };
  const handleCancel = () => {
    setShowConsentModal(false);
    setPendingAction(null);
  };

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
          <div className={`text-sm font-medium mb-3 ${accentClass}`}>🔒 完整报告仅对会员开放</div>
          <div className="text-sm text-gray-600 mb-3">
            会员可查看：{premiumSections.join('、')}
          </div>

          {/* 价格卡片：单次解锁 / 月度会员 并排 */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
              <div className="text-xs text-gray-500" style={{ fontFamily: 'inherit' }}>单次解锁</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">¥9.9</div>
              <div className="text-[10px] text-gray-400 mt-0.5">仅限本报告</div>
            </div>
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-center relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                推荐
              </div>
              <div className="text-xs text-amber-700">月度会员</div>
              <div className="text-2xl font-bold text-amber-700 mt-1">¥29.9<span className="text-xs">/月</span></div>
              <div className="text-[10px] text-amber-600 mt-0.5">全站 6 大模块全解锁</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
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
                {/* 已登录免费用户：单次解锁 + 升级会员 按钮 */}
                <button
                  onClick={() =>
                    guarded(() => {
                      window.location.href = `/api/create-checkout-session?type=single&report=${reportKey}`;
                    })
                  }
                  className="flex-1 py-2 bg-white border border-[#2c2c2c] text-[#2c2c2c] rounded hover:bg-gray-50 transition-colors text-sm"
                >
                  单次解锁 · ¥9.9
                </button>
                <Link
                  href="/tong/pricing"
                  className="flex-1 py-2 bg-[#b85a4a] text-white text-center rounded hover:bg-[#9a4a3a] transition-colors text-sm"
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

          {/* 信任徽标：支付安全 / 本地计算 / 退款保障 */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-500">
            <div>
              <div className="text-base">🛡️</div>
              <div>支付由 Stripe 保障</div>
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
      {showConsentModal && (
        <ConsentModal onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </>
  );
}
