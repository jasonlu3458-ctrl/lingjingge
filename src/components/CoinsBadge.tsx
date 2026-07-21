'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CoinsResponse {
  ok: boolean;
  balance: number;
  signed_in_today: boolean;
  mock?: boolean;
}

/**
 * 牧心丹徽标（Navbar 右上角）
 *
 * - 登录后展示余额；未登录 / mock → 隐藏
 * - 未登录时返回 401 → 直接隐藏
 * - 跳转到 /tong/profile 详情卡
 * - 在 /tong/profile 自身也显示（避免重复点击）
 */
export default function CoinsBadge() {
  const [balance, setBalance] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/user/coins', { cache: 'no-store' });
      if (res.status === 401) {
        setVisible(false);
        return;
      }
      const json: CoinsResponse = await res.json();
      if (!json.ok) {
        setVisible(false);
        return;
      }
      // 未登录 mock 模式：直接展示 0 也无意义 → 隐藏
      if (json.mock && json.balance === 0) {
        setVisible(false);
        return;
      }
      setBalance(json.balance);
      setVisible(true);
    } catch {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 监听自定义事件，签到后由 CoinsCard 派发，Navbar 即时刷新
  useEffect(() => {
    function onCoinsChanged(ev: Event) {
      const detail = (ev as CustomEvent<{ balance: number }>).detail;
      if (typeof detail?.balance === 'number') {
        setBalance(detail.balance);
        setVisible(true);
      } else {
        load();
      }
    }
    window.addEventListener('lingjing:coins-changed', onCoinsChanged as EventListener);
    return () => window.removeEventListener('lingjing:coins-changed', onCoinsChanged as EventListener);
  }, [load]);

  // 路由变化重新拉一次（避免余额陈旧）
  useEffect(() => {
    load();
  }, [pathname, load]);

  if (!visible || balance === null) return null;

  return (
    <Link
      href="/tong/profile"
      prefetch={false}
      aria-label={`牧心丹余额 ${balance} 枚`}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-800 hover:bg-amber-100 transition-colors text-sm"
      title="牧心丹余额 · 点击签到"
    >
      <span aria-hidden>🪙</span>
      <span className="font-semibold tabular-nums">{balance}</span>
    </Link>
  );
}
