'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingLandscape from '@/components/FloatingLandscape';
import ZenAvatar from '@/components/ZenAvatar';

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showZen, setShowZen] = useState(false);
  const [dailyZen, setDailyZen] = useState('');
  const [zenSource, setZenSource] = useState('');

  const scrollToCards = () => {
    cardsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当用户滚动到第二屏下方时，自动显示浮窗
  useEffect(() => {
    const handleScroll = () => {
      const cardSection = document.getElementById('card-section');
      if (cardSection) {
        const rect = cardSection.getBoundingClientRect();
        if (rect.bottom < window.innerHeight) {
          setShowZen(true);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 获取每日禅机
  useEffect(() => {
    fetch('/api/daily-zen')
      .then(res => res.json())
      .then(data => {
        const parts = data.zen.split('—');
        setDailyZen(parts[0].trim());
        setZenSource(parts.length > 1 ? parts[1].trim() : '');
      });
  }, []);

  // 当禅机浮窗弹出时，播放音效
  useEffect(() => {
    if (showZen && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [showZen]);

  return (
    <div className="min-h-screen bg-zen-beige">
      {/* 音频元素 */}
      <audio ref={audioRef} src="/music/bell.mp3" preload="auto" />

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
        <section id="card-section" ref={cardsRef} className="max-w-6xl mx-auto scroll-mt-12">
          {/* ① 顶部大标题 —— 注入「灵境尊者」IP */}
          <h2
            className="text-center text-2xl md:text-4xl text-[#3a3a3a] mb-3 font-serif tracking-wider"
            style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
          >
            夜深人静，灵境尊者陪你静修
          </h2>
          <p
            className="text-center text-sm md:text-base text-[#7a7a7a] mb-10 font-serif"
            style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
          >
            解惑 · 内观 · 藏经 · 同修 —— 四大入口，归于一心
          </p>

          {/* ② "免费试修"横幅 —— 极简灵境行者剪影 + 黑色胶囊按钮 */}
          <div className="mb-10 rounded-2xl border border-[#e8e0d0] bg-white/70 backdrop-blur-sm shadow-sm p-5 md:p-6 flex items-center gap-4 md:gap-6">
            <div className="flex-shrink-0">
              <ZenAvatar size={64} opacity={0.35} />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-base md:text-lg font-serif text-[#2c2c2c] mb-1"
                style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif", letterSpacing: '1px' }}
              >
                免费试修
              </h3>
              <p
                className="text-xs md:text-sm text-[#7a7a7a] leading-relaxed"
                style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
              >
                灵境尊者初相见，先与你试修一课 —— 一段对话，一次照见
              </p>
            </div>
            <Link
              href="/wen/chan/ai-zen-master"
              className="flex-shrink-0 h-10 px-5 inline-flex items-center justify-center bg-[#1a1a1a] text-white rounded-full text-sm font-medium hover:bg-[#2c2c2c] transition-colors"
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif", letterSpacing: '1px' }}
            >
              立即体验 →
            </Link>
          </div>

          {/* ③ 四张卡片：解惑 / 内观 / 藏经 / 同修 —— 移动 1 列，md 2 列，lg 4 列 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 解惑 · AI 禅师 */}
            <Link href="/wen/chan/ai-zen-master" className="group">
              <div className="h-full w-full bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col">
                <div className="flex justify-center mb-3">
                  <ZenAvatar size={48} opacity={0.25} />
                </div>
                <h2 className="text-xl font-bold text-zen-ink text-center mb-2 font-serif">
                  AI 禅师
                </h2>
                <p className="text-sm text-gray-600 text-center leading-relaxed flex-1">
                  与 AI 禅师对话，解开心灵困惑，寻找内心宁静
                </p>
                <div className="mt-4 flex justify-center">
                  <span className="w-full sm:w-auto justify-center bg-gray-100/80 hover:bg-gray-200/80 text-gray-800 px-5 py-2 rounded-full text-sm inline-flex items-center gap-1 transition-colors group-hover:bg-gray-200/80 min-h-[44px]">
                    去体验 <span aria-hidden>→</span>
                  </span>
                </div>
              </div>
            </Link>

            {/* 内观 · 体质观察 */}
            <Link href="/guan/health" className="group">
              <div className="h-full w-full bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col">
                <div className="text-5xl mb-3 text-center">🌿</div>
                <h2 className="text-xl font-bold text-zen-ink text-center mb-2 font-serif">
                  体质观察
                </h2>
                <p className="text-sm text-gray-600 text-center leading-relaxed flex-1">
                  中医体质辨识，舌象分析，了解自己的身体状态
                </p>
                <div className="mt-4 flex justify-center">
                  <span className="w-full sm:w-auto justify-center bg-gray-100/80 hover:bg-gray-200/80 text-gray-800 px-5 py-2 rounded-full text-sm inline-flex items-center gap-1 transition-colors group-hover:bg-gray-200/80 min-h-[44px]">
                    去体验 <span aria-hidden>→</span>
                  </span>
                </div>
              </div>
            </Link>

            {/* 藏经 · 藏经阁 */}
            <Link href="/zang/library" className="group">
              <div className="h-full w-full bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col">
                <div className="text-5xl mb-3 text-center">📚</div>
                <h2 className="text-xl font-bold text-zen-ink text-center mb-2 font-serif">
                  藏经阁
                </h2>
                <p className="text-sm text-gray-600 text-center leading-relaxed flex-1">
                  经典原文与白话对照，术语百科注释，潜心研读东方智慧
                </p>
                <div className="mt-4 flex justify-center">
                  <span className="w-full sm:w-auto justify-center bg-gray-100/80 hover:bg-gray-200/80 text-gray-800 px-5 py-2 rounded-full text-sm inline-flex items-center gap-1 transition-colors group-hover:bg-gray-200/80 min-h-[44px]">
                    去参读 <span aria-hidden>→</span>
                  </span>
                </div>
              </div>
            </Link>

            {/* 同修 · 同心同修 */}
            <Link href="/tong" className="group">
              <div className="h-full w-full bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col">
                <div className="text-5xl mb-3 text-center">🫂</div>
                <h2 className="text-xl font-bold text-zen-ink text-center mb-2 font-serif">
                  同心同修
                </h2>
                <p className="text-sm text-gray-600 text-center leading-relaxed flex-1">
                  加入同修社区，与同道中人共修打卡
                </p>
                <div className="mt-4 flex justify-center">
                  <span className="w-full sm:w-auto justify-center bg-gray-100/80 hover:bg-gray-200/80 text-gray-800 px-5 py-2 rounded-full text-sm inline-flex items-center gap-1 transition-colors group-hover:bg-gray-200/80 min-h-[44px]">
                    去同行 <span aria-hidden>→</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>
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

      {/* 底部浮窗 */}
      <AnimatePresence>
        {showZen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 z-50"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-400">每日禅机</div>
              <button onClick={() => setShowZen(false)} className="text-gray-400 hover:text-[#2c2c2c]">✕</button>
            </div>
            <div className="text-lg md:text-xl font-serif text-[#2c2c2c] leading-relaxed">
              {dailyZen}
            </div>
            {zenSource && (
              <div className="mt-2 text-sm text-gray-500">—— {zenSource}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 固定"禅"字按钮 */}
      {!showZen && (
        <button
          onClick={() => setShowZen(true)}
          className="fixed bottom-4 right-4 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-105 transition-transform z-50"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
        >
          禅
        </button>
      )}

      {/* AI 引路人 - 水墨仙岛 */}
      <FloatingLandscape />
    </div>
  );
}
