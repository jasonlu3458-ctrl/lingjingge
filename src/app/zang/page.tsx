import Link from 'next/link';
import { getUserRole } from '@/lib/auth';

export const metadata = {
  title: '藏经 · 灵境阁',
  description: '藏经系列：藏经阁、术语百科、法脉源流 — 经典智慧，原文与解读。',
};

interface Card {
  title: string;
  href: string;
  icon: string;
  tagline: string;
  free: string;
  border: string;
  iconBg: string;
  accent: string;
}

const CARDS: Card[] = [
  {
    title: '藏经阁',
    href: '/zang/library',
    icon: '📚',
    tagline: '老子 / 周文王 / 释迦牟尼 / 慧能 — 原文与白话。',
    free: '原文免费 · 译文会员',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    accent: 'text-amber-700',
  },
  {
    title: '术语百科',
    href: '/zang/terms',
    icon: '📖',
    tagline: '禅宗 / 道家 / 佛教 / 易经常见术语速查。',
    free: '完全免费',
    border: 'border-stone-200',
    iconBg: 'bg-stone-100',
    accent: 'text-stone-700',
  },
  {
    title: '法脉源流',
    href: '/zang/lineage',
    icon: '📜',
    tagline: '从佛陀拈花到临济棒喝，千年智慧一脉相承。',
    free: '完全免费',
    border: 'border-orange-200',
    iconBg: 'bg-orange-100',
    accent: 'text-orange-700',
  },
];

export default async function ZangPage() {
  await getUserRole();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1
          className="text-4xl text-[#2c2c2c] mb-3"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          📚 藏经
        </h1>
        <p
          className="text-gray-600 text-sm"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          经典是千年的对话，源头活水
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            prefetch
            className={`group block rounded-2xl border ${c.border} bg-white p-6 hover:shadow-lg transition-all`}
          >
            <div className={`w-14 h-14 rounded-xl ${c.iconBg} flex items-center justify-center text-3xl mb-4`}>
              {c.icon}
            </div>
            <h3
              className={`text-xl mb-2 ${c.accent}`}
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
            >
              {c.title}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">{c.tagline}</p>
            <span
              className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${
                c.free === '完全免费'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {c.free}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
