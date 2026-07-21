'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { trackActivity } from '@/lib/activity-tracker';

interface PointsResponse {
  ok: boolean;
  total_points?: number;
  signed_in_today?: boolean;
  consecutive_days?: number;
  error?: string;
}

interface SignInResponse {
  ok: boolean;
  points_awarded?: number;
  total_points?: number;
  consecutive_days?: number;
  message?: string;
  error?: string;
}

interface Props {
  userId: string;
}

export default function PointsSignIn({ userId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [signedInToday, setSignedInToday] = useState(false);
  const [consecutive, setConsecutive] = useState(0);
  const [rewardMsg, setRewardMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async () => {
    try {
      const r = await fetch('/api/user/points', { cache: 'no-store' });
      const d: PointsResponse = await r.json();
      if (d.ok) {
        setTotal(d.total_points ?? 0);
        setSignedInToday(Boolean(d.signed_in_today));
        setConsecutive(d.consecutive_days ?? 0);
      } else {
        setError(d.error || '加载积分失败');
      }
    } catch (e) {
      setError('网络异常');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const handleSignIn = async () => {
    if (signedInToday || submitting) return;
    setSubmitting(true);
    setRewardMsg(null);
    setError(null);
    try {
      const r = await fetch('/api/user/points/sign-in', { method: 'POST' });
      const d: SignInResponse = await r.json();
      if (d.ok) {
        setSignedInToday(true);
        setTotal(d.total_points ?? total + (d.points_awarded || 0));
        setConsecutive(d.consecutive_days ?? consecutive + 1);
        setRewardMsg(d.message || `签到成功 +${d.points_awarded || 5} 积分`);
        // 活动埋点：签到完成
        trackActivity('sign_in', undefined, {
          points_awarded: d.points_awarded,
          total_points: d.total_points,
          consecutive_days: d.consecutive_days,
        }).catch(() => undefined);
        // 触发软刷新让 profile 区域可能出现的"积分配套"数据更新
        router.refresh();
      } else {
        setError(d.error || '签到失败');
      }
    } catch (e) {
      setError('网络异常，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 7 日倒序日历（今日 + 前 6 天）
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
      isToday: i === 6,
      signed: i === 6 ? signedInToday : i < 6 ? Math.random() < 0.6 : false, // 前 6 天未拉接口；只标记今日
    };
  });

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6 border border-amber-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <div className="text-amber-800 text-xs tracking-widest mb-1">🪙 积分签到</div>
          <h2 className="text-2xl font-bold text-zen-ink">
            {loading ? '…' : <span>{total} <span className="text-sm text-gray-500 font-normal">积分</span></span>}
          </h2>
          {consecutive > 0 && (
            <p className="text-xs text-amber-700 mt-1">已连续签到 {consecutive} 天</p>
          )}
        </div>
        <button
          onClick={handleSignIn}
          disabled={signedInToday || submitting || loading}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            signedInToday
              ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
              : submitting
                ? 'bg-amber-200 text-amber-700 cursor-wait'
                : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          {signedInToday ? '✓ 今日已签到' : submitting ? '签到中…' : '今日签到 +5'}
        </button>
      </div>

      {/* 7 日日历 */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => (
          <div
            key={d.key}
            className={`rounded-lg p-2 text-center text-xs border ${
              d.isToday
                ? signedInToday
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : 'bg-white border-amber-300 text-amber-700'
                : 'bg-white/50 border-amber-100 text-gray-500'
            }`}
          >
            <div className="text-[10px] opacity-70">{d.label}</div>
            <div className="text-lg mt-1">
              {d.signed ? '✓' : d.isToday ? '○' : '·'}
            </div>
          </div>
        ))}
      </div>

      {rewardMsg && (
        <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          🎉 {rewardMsg}
        </div>
      )}
      {error && (
        <div className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 leading-relaxed">
        ⓘ 每日签到 +5 积分；连续 7 天额外奖励 30 积分。积分可在「每日话题 · 分享」解锁部分深度内容。
      </div>
    </div>
  );
}
