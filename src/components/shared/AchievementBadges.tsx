'use client';

import { useEffect, useState } from 'react';

export interface Achievement {
  id: string;
  title: string;
  hint: string;
  icon: string;
  /** 解锁所需连续签到天数 */
  threshold: number;
  /** 解锁后的颜色（hex） */
  color: string;
  /** 解锁后的光晕（rgba） */
  glow: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'novice',
    title: '初入山门',
    hint: '连续签到 3 日',
    icon: '🌱',
    threshold: 3,
    color: '#9CA3AF',
    glow: 'rgba(156,163,175,0.35)',
  },
  {
    id: 'meditator',
    title: '禅房打坐',
    hint: '连续签到 7 日',
    icon: '🧘',
    threshold: 7,
    color: '#D4AF37',
    glow: 'rgba(212,175,55,0.45)',
  },
  {
    id: 'pilgrim',
    title: '云游大德',
    hint: '连续签到 30 日',
    icon: '☁️',
    threshold: 30,
    color: '#A78BFA',
    glow: 'rgba(167,139,250,0.45)',
  },
];

export interface AchievementBadgesProps {
  /** 连续签到天数（从父组件传；可为 undefined 表示未登录/未签到） */
  streakDays?: number;
  /** 加载占位 */
  loading?: boolean;
  className?: string;
  /** 主题：'muxintang' 玄铁黑金 / 'lingjingge' 米白 */
  theme?: 'muxintang' | 'lingjingge';
}

/**
 * 修行成就徽章展示区。
 * - 连续签到达到阈值 → 徽章解锁（金/紫光晕 + 实心）
 * - 未达到 → 灰阶蒙版 + "未解锁"提示
 * - 纯前端静态数据：实际 streak 由父组件从 user_activities 计算后传入
 */
export default function AchievementBadges({
  streakDays,
  loading = false,
  className = '',
  theme = 'lingjingge',
}: AchievementBadgesProps) {
  // 客户端兜底：若父组件未传 streak，从 /api/user/me 拉一次
  const [fallback, setFallback] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (streakDays !== undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/me');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setFallback(typeof data?.streak === 'number' ? data.streak : 0);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [streakDays]);

  const days = streakDays ?? fallback ?? 0;
  const isDark = theme === 'muxintang';

  const titleClass = isDark ? 'text-[#D4AF37]' : 'text-[#5a3e1a]';
  const cardClass = isDark
    ? 'bg-[#1A1A1A] border-[#333]'
    : 'bg-white border-amber-200/60';

  return (
    <section
      aria-label="修行成就"
      className={`rounded-2xl p-5 sm:p-6 border ${cardClass} ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏅</span>
          <h3
            className={`text-base font-semibold ${titleClass}`}
            style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
          >
            修行成就
          </h3>
        </div>
        <div className={`text-xs ${isDark ? 'text-[#808080]' : 'text-gray-500'}`}>
          连续签到 <span className={`font-semibold ${isDark ? 'text-[#D4AF37]' : 'text-amber-700'}`}>{days}</span> 天
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = days >= a.threshold;
          return (
            <div
              key={a.id}
              className={`relative flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-xl border transition-all ${
                unlocked
                  ? isDark
                    ? 'bg-[#0a0a0a] border-[#D4AF37]/40'
                    : 'bg-gradient-to-br from-amber-50/80 to-white border-amber-300/60'
                  : isDark
                    ? 'bg-[#0a0a0a]/60 border-[#333] opacity-50'
                    : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
              style={
                unlocked
                  ? { boxShadow: `0 0 18px ${a.glow}` }
                  : undefined
              }
              title={a.hint}
            >
              <span
                className="text-3xl transition-transform"
                style={{ filter: unlocked ? 'none' : 'grayscale(80%)' }}
                aria-hidden
              >
                {a.icon}
              </span>
              <span
                className={`text-xs font-semibold ${
                  unlocked
                    ? isDark ? 'text-[#D4AF37]' : 'text-amber-700'
                    : isDark ? 'text-[#666]' : 'text-gray-500'
                }`}
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {a.title}
              </span>
              <span
                className={`text-[10px] ${
                  unlocked
                    ? isDark ? 'text-[#A78BFA]' : 'text-purple-600'
                    : isDark ? 'text-[#555]' : 'text-gray-400'
                }`}
              >
                {unlocked ? '✓ 已解锁' : `${a.threshold}日解锁`}
              </span>
              {unlocked && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                  style={{ background: a.color, boxShadow: `0 0 8px ${a.glow}` }}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className={`mt-3 text-center text-xs ${isDark ? 'text-[#808080]' : 'text-gray-400'}`}>
          加载中…
        </div>
      )}
    </section>
  );
}
