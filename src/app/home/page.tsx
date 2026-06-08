'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import FloatingLandscape from '@/components/FloatingLandscape';

const dailyZenQuotes = [
  "心若无尘，岁月生香",
  "一念心清净，处处莲花开",
  "平常心是道",
  "行到水穷处，坐看云起时",
  "本来无一物，何处惹尘埃",
  "菩提本无树，明镜亦非台",
  "应无所住而生其心",
];

export default function HomePage() {
  const todayQuote = dailyZenQuotes[new Date().getDate() % dailyZenQuotes.length];
  const cardsRef = useRef<HTMLDivElement>(null);

  const scrollToCards = () => {
    cardsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zen-beige">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero 区域 */}
        <section className="flex flex-col items-center justify-center min-h-[60vh] mb-16">
          {/* LOGO */}
          <div className="mb-6">
            <Image 
              src="/images/logo.png" 
              alt="灵境阁" 
              width={80} 
              height={80} 
              className="rounded-full opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>
          
          {/* 主标题 */}
          <h1 
            className="text-3xl md:text-7xl text-[#2c2c2c] mb-6 tracking-wider zen-fade-in"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            向内观，自有灵山
          </h1>
          
          {/* 副标题 */}
          <p 
            className="text-sm md:text-xl text-[#5a5a5a] max-w-md mb-10 leading-relaxed text-center px-4 zen-fade-in-delay-1"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            你的AI心智伙伴，陪你在喧嚣中，找到内心的清净道场。
          </p>
          
          {/* 按钮 */}
          <button 
            onClick={scrollToCards}
            className="px-8 py-4 bg-[#2c2c2c] text-white rounded-full hover:bg-[#4a4a4a] transition-all duration-300 hover:scale-105 hover:shadow-lg zen-fade-in-delay-2"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}
          >
            开启心智之旅
          </button>
        </section>

        {/* 每日参悟 */}
        <section className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-zen-ink mb-6 zen-fade-in">
            每日参悟
          </h2>
          
          {/* 毛笔笔触分隔线 */}
          <div className="ink-brush-line mb-8 zen-fade-in-delay-1"></div>
          
          <div className="zen-card rounded-lg p-8 max-w-3xl mx-auto zen-fade-in-delay-2">
            <p className="text-2xl md:text-3xl text-zen-ink font-light italic leading-relaxed">
              {todayQuote}
            </p>
            <div className="mt-6 w-24 h-1 bg-zen-ink mx-auto opacity-30"></div>
          </div>
        </section>

        {/* 功能入口 */}
        <section ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 scroll-mt-12">
          {/* AI 禅师 */}
          <Link href="/wen/chan/ai-zen-master" className="group">
            <div className="zen-card rounded-lg p-8 hover:-translate-y-1">
              <div className="text-5xl mb-4 text-center">🧘</div>
              <h2 className="text-2xl font-bold text-zen-ink text-center mb-3">
                AI 禅师
              </h2>
              <p className="text-gray-600 text-center">
                与 AI 禅师对话，解开心灵困惑，寻找内心宁静
              </p>
            </div>
          </Link>

          {/* AI 疗愈师 */}
          <Link href="/wen/liao/mind" className="group">
            <div className="zen-card rounded-lg p-8 hover:-translate-y-1">
              <div className="text-5xl mb-4 text-center">💚</div>
              <h2 className="text-2xl font-bold text-zen-ink text-center mb-3">
                AI 疗愈师
              </h2>
              <p className="text-gray-600 text-center">
                音疗冥想，正念放松，找回身心平衡与内在平静
              </p>
            </div>
          </Link>

          {/* 体质观察 */}
          <Link href="/guan/health" className="group">
            <div className="zen-card rounded-lg p-8 hover:-translate-y-1">
              <div className="text-5xl mb-4 text-center">🌿</div>
              <h2 className="text-2xl font-bold text-zen-ink text-center mb-3">
                体质观察
              </h2>
              <p className="text-gray-600 text-center">
                中医体质辨识，舌象分析，了解自己的身体状态
              </p>
            </div>
          </Link>

          {/* 取名轩 */}
          <Link href="/guan/name" className="group">
            <div className="zen-card rounded-lg p-8 hover:-translate-y-1">
              <div className="text-5xl mb-4 text-center">📜</div>
              <h2 className="text-2xl font-bold text-zen-ink text-center mb-3">
                取名轩
              </h2>
              <p className="text-gray-600 text-center">
                融合传统文化与现代美学，为宝宝取一个好名字
              </p>
            </div>
          </Link>
        </section>

        {/* Footer */}
        <footer className="py-8 bg-[#f5f0eb] border-t border-gray-200 mt-20">
          <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Image src="/images/logo.png" alt="灵境阁" width={24} height={24} />
              <span className="text-sm font-serif text-[#2c2c2c]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                灵境阁
              </span>
            </div>
            <p className="text-xs text-gray-400">向内观，自有灵山</p>
          </div>
        </footer>
      </main>

      {/* AI 引路人 - 水墨仙岛 */}
      <FloatingLandscape />
    </div>
  );
}
