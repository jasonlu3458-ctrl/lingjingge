import Link from 'next/link';
import { getUserRole } from '@/lib/auth';

export const metadata = {
  title: '内观 · 灵境阁',
  description: '内观系列：AI 生命密码、婚姻家庭、事业财富、子女教育、家居环境、身心合一。',
};

interface Card {
  title: string;
  href: string;
  icon: string;
  tagline: string;
  border: string;
  iconBg: string;
  accent: string;
}

const CARDS: Card[] = [
  {
    title: 'AI 生命密码',
    href: '/guan/lifecode',
    icon: '🔮',
    tagline: '揭秘你的天赋与人生使命，附赠取名建议。',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100',
    accent: 'text-purple-700',
  },
  {
    title: 'AI 婚姻家庭',
    href: '/guan/family',
    icon: '💞',
    tagline: '解结化怨，重建亲密关系。',
    border: 'border-rose-200',
    iconBg: 'bg-rose-100',
    accent: 'text-rose-700',
  },
  {
    title: 'AI 事业财富',
    href: '/guan/wealth',
    icon: '💎',
    tagline: '君子爱财，取之有道 —— 看清格局，谋定后动。',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    accent: 'text-amber-700',
  },
  {
    title: 'AI 子女教育',
    href: '/guan/education',
    icon: '🌱',
    tagline: '懂孩子，才能教孩子。',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    accent: 'text-emerald-700',
  },
  {
    title: 'AI 家居环境',
    href: '/guan/house',
    icon: '🏠',
    tagline: '住的舒服，就是最好的居住之道。',
    border: 'border-slate-200',
    iconBg: 'bg-slate-100',
    accent: 'text-slate-700',
  },
  {
    title: 'AI 身心合一',
    href: '/guan/body',
    icon: '🌿',
    tagline: '炼体炼心，整合体质 / 炼体 / 情绪 / 前世因缘。',
    border: 'border-green-200',
    iconBg: 'bg-green-100',
    accent: 'text-green-700',
  },
];

export default async function GuanPage() {
  await getUserRole(); // 保持与服务端组件一致性

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1
          className="text-4xl text-[#2c2c2c] mb-3"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          🪞 内观
        </h1>
        <p
          className="text-gray-600 text-sm"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          向内看，看见自己本来的样子
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
