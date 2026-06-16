'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CountResponse {
  ok: boolean;
  count?: number;
  reward_claimed?: boolean;
  invited_by?: string | null;
  error?: string;
}

interface RewardResponse {
  ok: boolean;
  message?: string;
  days_awarded?: number;
  error?: string;
}

export default function InvitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const r = await fetch('/api/user/invite/count', { cache: 'no-store' });
      const d: CountResponse = await r.json();
      if (d.ok) {
        setCount(d.count ?? 0);
        setRewardClaimed(Boolean(d.reward_claimed));
      } else {
        setError(d.error || '加载失败');
      }
    } catch (e) {
      setError('网络异常');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // 邀请链接（前端 mock base；上线后从 session/user.id 生成唯一短码）
  const inviteHref = typeof window !== 'undefined' ? `${window.location.origin}/tong/signup?ref=YOUR_CODE` : '/tong/signup';
  const inviteText = `【灵境阁】我在这个东方智慧 AI 导引平台里精进 — 邀你同修：${inviteHref}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    setClaimMsg(null);
    setError(null);
    try {
      const r = await fetch('/api/user/invite/reward', { method: 'POST' });
      const d: RewardResponse = await r.json();
      if (d.ok) {
        setRewardClaimed(true);
        setClaimMsg(d.message || `已到账 ${d.days_awarded || 7} 天会员`);
        router.refresh();
      } else {
        setError(d.error || '领取失败');
      }
    } catch (e) {
      setError('网络异常');
    } finally {
      setClaiming(false);
    }
  };

  // 进度：每邀请 1 人即可领 7 天；满 3 人额外再领 30 天
  const tiers = [
    { need: 1, reward: '7 天会员', claimed: rewardClaimed && count >= 1 },
    { need: 3, reward: '+30 天会员', claimed: rewardClaimed && count >= 3 },
    { need: 5, reward: '+90 天会员', claimed: rewardClaimed && count >= 5 },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link href="/tong" className="text-xs text-gray-400 hover:text-gray-600">
          ← 返回同修
        </Link>
      </div>

      <div className="text-center mb-8">
        <div className="text-rose-700 text-sm tracking-widest mb-2">🎁 邀请好友</div>
        <h1
          className="text-4xl text-[#2c2c2c] mb-3"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          邀一位同修入阁
        </h1>
        <p className="text-sm text-gray-500">道不孤，必有邻。邀一赠一，各得 7 天会员。</p>
      </div>

      {/* 当前邀请人数卡片 */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50 rounded-3xl p-8 sm:p-10 border border-rose-100 shadow-sm mb-6 text-center">
        <div className="text-xs text-rose-700 tracking-widest mb-2">已邀请人数</div>
        <div className="text-6xl font-bold text-rose-700 mb-3" style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}>
          {loading ? '…' : count}
        </div>
        <div className="text-xs text-gray-500">人（累计成功注册的同修）</div>
      </div>

      {/* 链接复制 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="text-xs text-gray-500 mb-2">专属邀请链接</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 px-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 text-gray-700 truncate">
            {inviteHref}
          </div>
          <button
            onClick={handleCopy}
            className="px-5 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors whitespace-nowrap"
          >
            {copied ? '✓ 已复制' : '📋 复制链接'}
          </button>
        </div>
        <button
          onClick={handleCopy}
          className="mt-3 w-full text-sm py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
        >
          {copied ? '✓ 分享文本已复制' : '📨 复制分享文本（含邀请文案）'}
        </button>
      </div>

      {/* 奖励阶梯 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">🎯 奖励阶梯</h3>
        <div className="space-y-2">
          {tiers.map((t) => {
            const reached = count >= t.need;
            return (
              <div
                key={t.need}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  reached ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      reached ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-white'
                    }`}
                  >
                    {reached ? '✓' : t.need}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      邀请 {t.need} 人
                    </div>
                    <div className="text-xs text-gray-500">奖励：{t.reward}</div>
                  </div>
                </div>
                {reached && !t.claimed && (
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="text-xs px-3 py-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700"
                  >
                    {claiming ? '领取中…' : '领取'}
                  </button>
                )}
                {t.claimed && (
                  <span className="text-xs text-emerald-600">✓ 已领</span>
                )}
              </div>
            );
          })}
        </div>
        {claimMsg && (
          <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            🎉 {claimMsg}
          </div>
        )}
        {error && (
          <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
            {error}
          </div>
        )}
      </div>

      <div className="text-center text-xs text-gray-400">
        ⓘ 邀请奖励 = 会员天数，自动加到现有订阅期之上。
      </div>
    </div>
  );
}
