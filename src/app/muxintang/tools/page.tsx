'use client';

import Link from 'next/link';
import { 
  LifeCodeIcon, 
  TrendIcon, 
  MatchIcon, 
  HabitatIcon, 
  NameIcon, 
  ChooseDayIcon 
} from '@/components/muxintang/icons';

const tools = [
  { 
    id: 'chooseday', 
    label: '择日智选', 
    icon: ChooseDayIcon, 
    desc: '每日黄历、吉时宜忌', 
    href: '/muxintang/tools/chooseday',
    isFree: true 
  },
  { 
    id: 'trend', 
    label: '流年大势', 
    icon: TrendIcon, 
    desc: '年度运势与修行指引', 
    href: '/muxintang/tools/trend',
    isFree: true 
  },
  { 
    id: 'bazi', 
    label: '生命代码', 
    icon: LifeCodeIcon, 
    desc: '八字排盘，天赋底色', 
    href: '/muxintang/tools/bazi',
    isFree: false 
  },
  { 
    id: 'match', 
    label: '情缘合盘', 
    icon: MatchIcon, 
    desc: '合婚深解，情感报告', 
    href: '/muxintang/tools/match',
    isFree: false 
  },
  { 
    id: 'habitat', 
    label: '家居环境', 
    icon: HabitatIcon, 
    desc: '空间能量、风水优化', 
    href: '/muxintang/tools/habitat',
    isFree: false 
  },
  { 
    id: 'name', 
    label: '姓名心解', 
    icon: NameIcon, 
    desc: 'AI起名，阿阇梨心解', 
    href: '/muxintang/tools/name',
    isFree: false 
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            智测AI
          </h1>
          <p className="text-[#808080]">观照本心，智测工具</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <Link 
                key={tool.id} 
                href={tool.href}
                className={`muxintang-card p-6 text-center relative transition-all ${
                  tool.isFree 
                    ? 'hover:-translate-y-1' 
                    : 'hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                }`}
              >
                <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium ${
                  tool.isFree 
                    ? 'bg-gray-800/60 border border-gray-600 text-gray-300' 
                    : 'bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37]'
                }`}>
                  {tool.isFree ? '免费' : '⚡ 会员'}
                </span>
                
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <IconComponent className="w-full h-full text-[#D4AF37]" />
                </div>
                <h3 
                  className="text-xl font-semibold mb-2"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
                >
                  {tool.label}
                </h3>
                <p className="text-sm text-[#808080]">{tool.desc}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[#555555] text-xs tracking-widest">
            —— 每日免费使用 · 深度解读需会员/积分 ——
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[#555555] text-xs">
            所有测算结果仅供娱乐参考，不构成专业建议
          </p>
        </div>
      </div>
    </div>
  );
}