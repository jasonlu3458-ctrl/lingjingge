'use client';

import { useEffect, useState, useCallback } from 'react';

interface CoinsResponse {
  success: boolean;
  balance: number;
  coins_awarded?: number;
  signed_in_today: boolean;
  last_sign_in_date: string | null;
  message?: string;
  error?: string;
  mock?: boolean;
}

interface CoinsCardState {
  loading: boolean;
  data: CoinsResponse | null;
  signing: boolean;
  toast: { type: 'ok' | 'err'; text: string } | null;
}

/**
 * 牧心丹 · 每日签到卡
 *
 * - 加载时 GET /api/user/coins 拉余额 + 今日是否已签到
 * - 点击「签到」→ POST /api/user/coins/sign-in
 *   - 成功：余额 +10，按钮禁用并显示"今日已签到"
 *   - 409：toast 提示"今日已签到"
 *   - 未登录：toast 提示并跳登录
 */
export default function CoinsCard() {
  const [state, setState] = useState<CoinsCardState>({
    loading: true,
    data: null,
    signing: false,
    toast: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch('/api/user/coins', { cache: 'no-store' });
      const json: CoinsResponse = await res.json();
      setState((s) => ({ ...s, loading: false, data: json }));
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        toast: { type: 'err', text: '网络错误，请稍后再试' },
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // toast 自动消失
  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => setState((s) => ({ ...s, toast: null })), 2400);
    return () => clearTimeout(t);
  }, [state.toast]);

  async function handleSignIn() {
    if (state.signing) return;
    setState((s) => ({ ...s, signing: true }));
    try {
      const res = await fetch('/api/user/coins/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json: CoinsResponse = await res.json();

      if (res.status === 401) {
        setState((s) => ({
          ...s,
          signing: false,
          toast: { type: 'err', text: '请先登录后再签到' },
        }));
        // 1.2s 后跳登录
        setTimeout(() => {
          window.location.href = '/tong/login?redirect=/tong/profile';
        }, 1200);
        return;
      }
      if (res.status === 409) {
        setState((s) => ({
          ...s,
          signing: false,
          data: s.data ? { ...s.data, signed_in_today: true, balance: json.balance ?? s.data.balance } : s.data,
          toast: { type: 'err', text: json.error || '今日已签到' },
        }));
        return;
      }
      if (!res.ok || !json.success) {
        setState((s) => ({
          ...s,
          signing: false,
          toast: { type: 'err', text: json.error || `签到失败 (${res.status})` },
        }));
        return;
      }
      setState((s) => ({
        ...s,
        signing: false,
        data: {
          success: true,
          balance: json.balance,
          signed_in_today: true,
          last_sign_in_date: json.last_sign_in_date ?? null,
          mock: json.mock,
        },
        toast: { type: 'ok', text: `+${json.coins_awarded ?? 10} 牧心丹已到账` },
      }));
      // 派发事件：让 Navbar 徽标同步刷新
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lingjing:coins-changed', { detail: { balance: json.balance } })
        );
      }
    } catch {
      setState((s) => ({
        ...s,
        signing: false,
        toast: { type: 'err', text: '网络错误，请稍后再试' },
      }));
    }
  }

  const data = state.data;
  const balance = data?.balance ?? 0;
  const signed = !!data?.signed_in_today;
  const isMock = !!data?.mock;

  return (
    <div className="bg-gradient-to-br from-amber-50 via-amber-50/60 to-white rounded-xl shadow-lg p-6 mb-6 border border-amber-200/60">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* 左侧：标题 + 余额 */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-md flex-shrink-0">
            🪙
          </div>
          <div>
            <h2 className="text-lg font-bold text-amber-900 tracking-wide" style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}>
              牧心丹
            </h2>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-amber-700 tabular-nums">
                {state.loading ? '—' : balance}
              </span>
              <span className="text-xs text-amber-600/70">枚</span>
              {isMock && (
                <span className="text-[10px] text-amber-500/80 border border-amber-300 px-1.5 py-0.5 rounded">
                  演示
                </span>
              )}
            </div>
            <p className="text-xs text-amber-700/70 mt-0.5">
              {signed ? '今日已签到 · 明日再来' : '每日签到 +10'}
            </p>
          </div>
        </div>

        {/* 右侧：签到按钮 */}
        <button
          type="button"
          onClick={handleSignIn}
          disabled={state.signing || signed}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
            signed
              ? 'bg-amber-100 text-amber-700/60 cursor-not-allowed border border-amber-200'
              : state.signing
              ? 'bg-amber-300 text-white cursor-wait'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-700 active:scale-[0.98]'
          }`}
        >
          {state.signing ? '签到中…' : signed ? '✓ 今日已签到' : '✨ 每日签到 +10'}
        </button>
      </div>

      {/* 兑换预告（先只展示，不做入口） */}
      <div className="mt-4 pt-4 border-t border-amber-200/50 text-xs text-amber-800/70 leading-relaxed">
        💡 牧心丹可兑换：单次 AI 对话 · 特殊深度报告（即将开放）
      </div>

      {/* toast */}
      {state.toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm shadow-lg transition-all ${
            state.toast.type === 'ok'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {state.toast.text}
        </div>
      )}
    </div>
  );
}
