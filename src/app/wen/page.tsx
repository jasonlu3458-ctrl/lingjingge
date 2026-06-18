import Link from 'next/link';
import { getUserRole } from '@/lib/auth';

export const metadata = {
  title: '解惑 · 灵境阁',
  description: '解惑系列：AI 轻解忧、 AI 易理师、AI 疗愈师、AI 禅师 — 智慧入口一站直达。',
};

interface Card {
  title: string;
  href: string;
  icon: string;
  tagline: string;
  accent: string;
  border: string;
  iconBg: string;
}

const CARDS: Card[] = [
  {
    title: 'AI 轻解忧',
    href: '/wen/light-solution',
    icon: '💭',
    tagline: '说一句你现在的烦恼，让 AI 陪你理一理。',
    accent: 'text-sky-700',
    border: 'border-sky-200',
    iconBg: 'bg-sky-100',
  },
  {
    title: 'AI 易理师',
    href: '/wen/yi/yili',
    icon: '☯️',
    tagline: '起一卦，问你心中犹豫之事。',
    accent: 'text-amber-700',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
  },
  {
    title: 'AI 疗愈师',
    href: '/wen/liao/mind',
    icon: '💚',
    tagline: '自助工具 + AI 对话，温柔地疗愈你的情绪。',
    accent: 'text-emerald-700',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
  },
  {
    title: 'AI 禅师',
    href: '/wen/chan/ai-zen-master',
    icon: '🧘',
    tagline: '机锋对答，参悟禅心。',
    accent: 'text-stone-700',
    border: 'border-stone-300',
    iconBg: 'bg-stone-200',
  },
];

export default async function WenPage() {
  await getUserRole(); // 保持与服务端组件一致性

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1
          className="text-4xl text-[#2c2c2c] mb-3"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          🌙 解惑
        </h1>
        <p className="text-gray-600 text-sm" style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}>
          把困惑交给 AI，把心安在自己这里
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            prefetch
            className={`group block rounded-2xl border ${c.border} bg-white p-5 hover:shadow-lg transition-all`}
          >
            <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center text-2xl mb-3`}>
              {c.icon}
            </div>
            <h3
              className={`text-lg mb-1 ${c.accent}`}
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
            >
              {c.title}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{c.tagline}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                免费 5 次体验
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                深度报告 ¥9.9
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
