import Link from 'next/link';
import { getUserRole } from '@/lib/auth';

export const metadata = {
  title: '解惑 · 灵境阁',
  description: '解惑系列：9 位 AI 宗师，引流 → 留存 → 变现，一站直达。',
};

interface Card {
  title: string;
  href: string;
  icon: string;
  tagline: string;
  accent: string;
  border: string;
  iconBg: string;
  /** 漏斗档位：'lead' 引流（免费）/ 'engage' 留存（免费5次）/ 'convert' 变现（会员/积分） */
  tier: 'lead' | 'engage' | 'convert';
}

/**
 * 9 宫格严格按"引流→留存→变现"3×3 漏斗布局：
 *  - 引流（前 3）：免费标签，灰色，零门槛吸量
 *  - 留存（中 3）：免费 5 次体验，金色，5 次后付费墙锁留
 *  - 变现（后 3）：⚡ 会员/积分，红金色，深度服务付费转化
 */
const CARDS: Card[] = [
  // —— 引流（前 3，免费） ——
  {
    title: 'AI 推背师',
    href: '/wen/tuibei',
    icon: '📜',
    tagline: '推背图演绎，回望已逝，前瞻未至。',
    accent: 'text-stone-700',
    border: 'border-stone-300',
    iconBg: 'bg-stone-200',
    tier: 'lead',
  },
  {
    title: 'AI 星座师',
    href: '/wen/astrology',
    icon: '⭐',
    tagline: '仰望星空，十二宫位为你读心。',
    accent: 'text-indigo-700',
    border: 'border-indigo-200',
    iconBg: 'bg-indigo-100',
    tier: 'lead',
  },
  {
    title: 'AI 生肖师',
    href: '/wen/zodiac',
    icon: '🐉',
    tagline: '十二生肖，十二种人生智慧。',
    accent: 'text-rose-700',
    border: 'border-rose-200',
    iconBg: 'bg-rose-100',
    tier: 'lead',
  },
  // —— 留存（中 3，免费 5 次） ——
  {
    title: 'AI 解忧师',
    href: '/wen/light-solution',
    icon: '💭',
    tagline: '说一句你现在的烦恼，让 AI 陪你理一理。',
    accent: 'text-sky-700',
    border: 'border-sky-200',
    iconBg: 'bg-sky-100',
    tier: 'engage',
  },
  {
    title: 'AI 参禅师',
    href: '/wen/zen',
    icon: '🧘',
    tagline: '机锋对答，参悟禅心。',
    accent: 'text-stone-700',
    border: 'border-stone-300',
    iconBg: 'bg-stone-200',
    tier: 'engage',
  },
  {
    title: 'AI 疗愈师',
    href: '/wen/heal',
    icon: '💚',
    tagline: '自助工具 + AI 对话，温柔地疗愈你的情绪。',
    accent: 'text-emerald-700',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    tier: 'engage',
  },
  // —— 变现（后 3，会员/积分） ——
  {
    title: 'AI 取名师',
    href: '/wen/name',
    icon: '✍️',
    tagline: '名以载德，字以寄情——一个名字，一生的礼物。',
    accent: 'text-amber-700',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    tier: 'convert',
  },
  {
    title: 'AI 解梦师',
    href: '/wen/dream',
    icon: '🌙',
    tagline: '夜有所梦，日有所思——梦是心的一封密信。',
    accent: 'text-purple-700',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100',
    tier: 'convert',
  },
  {
    title: 'AI 易理学者',
    href: '/wen/yili',
    icon: '☯️',
    tagline: '起一智慧指引，问你心中犹豫之事。',
    accent: 'text-amber-700',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    tier: 'convert',
  },
];

/** 右上角定价标签：根据档位返回不同样式 */
function TierBadge({ tier }: { tier: Card['tier'] }) {
  if (tier === 'lead') {
    return (
      <span
        className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-300"
        style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
      >
        免费
      </span>
    );
  }
  if (tier === 'engage') {
    return (
      <span
        className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300"
        style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
      >
        免费 5 次
      </span>
    );
  }
  // convert
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-red-100 to-amber-100 text-red-700 border border-red-300"
      style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
    >
      ⚡ 会员/积分
    </span>
  );
}

export default async function WenPage() {
  await getUserRole(); // 保持与服务端组件一致性

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
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

      {/* 漏斗分区标签 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="text-center text-xs text-gray-500 py-1.5 px-3 rounded-lg border border-gray-200 bg-white/60">
          <span style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}>
            🔓 引流 · 免费体验
          </span>
        </div>
        <div className="text-center text-xs text-amber-700 py-1.5 px-3 rounded-lg border border-amber-300 bg-amber-50/60">
          <span style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}>
            🌿 留存 · 免费 5 次深度陪伴
          </span>
        </div>
        <div className="text-center text-xs text-red-700 py-1.5 px-3 rounded-lg border border-red-300 bg-gradient-to-r from-red-50 to-amber-50/60">
          <span style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}>
            💎 变现 · 会员 / 同修币深度服务
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            prefetch
            className={`group block rounded-2xl border ${c.border} bg-white p-5 hover:shadow-lg transition-all relative`}
          >
            {/* 右上角定价标签 */}
            <div className="absolute top-3 right-3">
              <TierBadge tier={c.tier} />
            </div>

            <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center text-2xl mb-3`}>
              {c.icon}
            </div>
            <h3
              className={`text-lg mb-1 pr-16 ${c.accent}`}
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
            >
              {c.title}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{c.tagline}</p>
            <span
              className="inline-flex items-center text-xs text-amber-700 group-hover:text-amber-900 transition-colors"
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
            >
              立即体验
              <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
