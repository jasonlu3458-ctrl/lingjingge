'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface SubStatus {
  role: 'free' | 'monthly' | 'yearly' | 'admin' | string;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'canceled' | 'expired' | 'inactive' | string;
  is_expired?: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  free: '云游 · 免费',
  monthly: '行者 · 月度会员',
  yearly: '真人 · 年度会员',
  admin: '管理员',
};

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  active:    { text: '生效中',   cls: 'bg-emerald-100 text-emerald-700' },
  canceled:  { text: '已取消（到期前可继续使用）', cls: 'bg-amber-100 text-amber-700' },
  expired:   { text: '已过期',   cls: 'bg-rose-100 text-rose-700' },
  inactive:  { text: '未订阅',   cls: 'bg-gray-100 text-gray-600' },
};

export default function SubscriptionStatusCard() {
  const router = useRouter();
  const [data, setData] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/user/subscription/status', { cache: 'no-store' });
      if (r.status === 401) {
        setData(null);
        setError('请先登录');
        return;
      }
      const d: SubStatus | { error: string } = await r.json();
      if ('error' in d) {
        setError(d.error);
      } else {
        setData(d);
      }
    } catch (e) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="text-sm text-gray-500">加载会员状态中…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 text-sm text-rose-700">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const roleLabel = ROLE_LABEL[data.role] || data.role;
  const statusKey = data.is_expired ? 'expired' : data.status;
  const statusInfo = STATUS_LABEL[statusKey] || STATUS_LABEL.inactive;

  const endDate = data.end_date ? new Date(data.end_date) : null;
  const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000)) : 0;
  const willExpireSoon = daysLeft > 0 && daysLeft <= 7;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zen-ink mb-2">💎 会员状态</h3>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-base font-medium text-zen-ink">{roleLabel}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
              {statusInfo.text}
            </span>
          </div>

          {data.start_date && (
            <p className="text-xs text-zen-ink/60">
              开通：{format(new Date(data.start_date), 'yyyy年MM月dd日', { locale: zhCN })}
            </p>
          )}
          {endDate && (
            <p className="text-xs text-zen-ink/60">
              到期：{format(endDate, 'yyyy年MM月dd日', { locale: zhCN })}
              {data.status === 'active' && !data.is_expired && daysLeft > 0 && (
                <span className="text-zen-ink/40"> （还剩 {daysLeft} 天）</span>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => router.push('/tong/pricing')}
            className="px-4 py-2 text-sm rounded-lg bg-zen-ink text-white hover:bg-zen-ink/80"
          >
            {data.role === 'free' || statusKey === 'expired' ? '立即开通' : '续费 / 升级'}
          </button>
          {data.role === 'free' && (
            <button
              onClick={() => router.push('/tong/invite')}
              className="px-4 py-2 text-sm rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
            >
              邀请送会员
            </button>
          )}
        </div>
      </div>

      {willExpireSoon && (
        <div className="mt-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          ⏰ 您的会员即将在 {daysLeft} 天后到期，建议尽快续费以免影响使用。
        </div>
      )}
    </div>
  );
}
