import Link from 'next/link';
import { getUserRole } from '@/lib/auth';

export const metadata = {
  title: '同修 · 灵境阁',
  description: '同修系列：社区、每日话题、个人中心、会员订阅、邀请好友。',
};

interface Card {
  title: string;
  href: string;
  icon: string;
  tagline: string;
  border: string;
  iconBg: string;
  accent: string;
  badge?: string;
}

const CARDS: Card[] = [
  {
    title: '社区',
    href: '/tong/community',
    icon: '🤝',
    tagline: '在论坛与各地同修一起探讨心得。',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    accent: 'text-blue-700',
  },
  {
    title: '每日话题',
    href: '/tong/daily-topic',
    icon: '☀️',
    tagline: '今天的话头、当下的一念。',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    accent: 'text-amber-700',
    badge: '每日更新',
  },
  {
    title: '个人中心',
    href: '/tong/profile',
    icon: '🏠',
    tagline: '账户、订阅、积分签到。',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    accent: 'text-emerald-700',
  },
  {
    title: '会员订阅',
    href: '/tong/pricing',
    icon: '💎',
    tagline: '解锁全部深度内容，专属云游权益。',
    border: 'border-violet-200',
    iconBg: 'bg-violet-100',
    accent: 'text-violet-700',
  },
  {
    title: '邀请好友',
    href: '/tong/invite',
    icon: '🎁',
    tagline: '邀一位同修入阁，双方各得 7 天会员。',
    border: 'border-rose-200',
    iconBg: 'bg-rose-100',
    accent: 'text-rose-700',
    badge: '奖励丰厚',
  },
];

export default async function TongPage() {
  await getUserRole();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1
          className="text-4xl text-[#2c2c2c] mb-3"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          🤝 同修
        </h1>
        <p
          className="text-gray-600 text-sm"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          道不孤，必有邻
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            prefetch
            className={`relative group block rounded-2xl border ${c.border} bg-white p-6 hover:shadow-lg transition-all`}
          >
            {c.badge && (
              <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {c.badge}
              </span>
            )}
            <div className={`w-14 h-14 rounded-xl ${c.iconBg} flex items-center justify-center text-3xl mb-4`}>
              {c.icon}
            </div>
            <h3
              className={`text-xl mb-2 ${c.accent}`}
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
            >
              {c.title}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">{c.tagline}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
