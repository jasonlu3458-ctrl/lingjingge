'use client';

import Link from 'next/link';
import { lineageTimeline } from '@/lib/muxintang/lineage-data';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            法脉源
          </h1>
          <p className="text-[#808080]">传承千年智慧，弘扬中华文脉</p>
        </div>

        <div className="muxintang-card p-8 mb-8">
          <h2 
            className="text-xl font-semibold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            📜 牧心堂简介
          </h2>
          <p className="text-[#C0C0C0] leading-relaxed mb-4">
            牧心堂，源自&quot;心之所向，牧之以道&quot;的理念，致力于融合东方智慧与现代科技，为用户提供专业的传统文化服务。
          </p>
          <p className="text-[#C0C0C0] leading-relaxed">
            我们的堂主任书颖阿阇梨，师从怡然金刚门下十余年，精通生命代码、家居环境、姓名心解、情缘合盘等传统术数，秉承师训，致力于将传统文化发扬光大。
          </p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-xl p-8 shadow-xl mb-8">
          <div className="mb-6 border-b border-[#D4AF37]/20 pb-4">
            <p className="text-[#D4AF37]/60 text-xs uppercase tracking-widest">法脉源流</p>
            <h2 className="text-3xl font-serif text-white mt-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              从青龙寺到牧心堂
            </h2>
            <p className="text-zinc-400 text-sm mt-1">一脉相承，千载不灭 —— 自唐密祖庭至当代师姐</p>
          </div>

          <div className="relative pl-6 space-y-8">
            <div className="absolute left-[7px] top-2 bottom-0 w-[2px] bg-[#D4AF37]/30"></div>

            {lineageTimeline.map((item, index) => (
              <div key={index} className="relative flex flex-col gap-1">
                <div className="absolute -left-[22px] top-1.5 w-4 h-4 rounded-full bg-[#0a0a0a] border-2 border-[#D4AF37] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                </div>
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4">
                  <span className="text-[#D4AF37]/70 text-sm font-mono whitespace-nowrap min-w-[120px]">{item.year}</span>
                  <h3 className="text-white text-lg font-bold">{item.title}</h3>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed pl-0 md:pl-[124px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="muxintang-card p-8">
          <h2 
            className="text-xl font-semibold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            🎯 使命与愿景
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[#D4AF37] font-medium mb-3">使命</h3>
              <p className="text-[#808080] text-sm leading-relaxed">
                传承中华五千年智慧，让传统文化在现代社会焕发新生，为每一位追求内心宁静与生活品质的人提供指引。
              </p>
            </div>
            <div>
              <h3 className="text-[#D4AF37] font-medium mb-3">愿景</h3>
              <p className="text-[#808080] text-sm leading-relaxed">
                成为最受信赖的传统文化服务平台，让每一个人都能从东方智慧中受益，实现身心和谐、家庭幸福、事业顺遂。
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/muxintang" className="muxintang-btn-inline">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}