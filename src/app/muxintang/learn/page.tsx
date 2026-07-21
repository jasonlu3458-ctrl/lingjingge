'use client';

import { useState } from 'react';
import Link from 'next/link';

const serialChapters = [
  { id: '1', title: '第一章：初入山门', desc: '那是一个深秋的午后，我第一次来到这座山中古刹...', date: '2024-01-15', reads: 1234 },
  { id: '2', title: '第二章：禅房夜话', desc: '师父的一席话，让我对"空"有了全新的理解...', date: '2024-01-22', reads: 986 },
  { id: '3', title: '第三章：晨钟暮鼓', desc: '日复一日的修行，在平凡中感悟非凡...', date: '2024-01-29', reads: 856 },
  { id: '4', title: '第四章：山中岁月', desc: '春去秋来，山中无历日，寒尽不知年...', date: '2024-02-05', reads: 721 },
];

const shortStories = [
  { title: '山寺一夜', sub: '借宿古寺，听老僧讲了一个关于"空"的故事。', readTime: '8 分钟', views: 341 },
  { title: '风铃与禅机', sub: '风动，铃动，心动。到底什么是真的在动？', readTime: '6 分钟', views: 276 },
  { title: '莲花的呼吸', sub: '只要心里有光，莲花就会在泥沼里开出花来。', readTime: '10 分钟', views: 521 },
  { title: '行者的鞋', sub: '一双破旧的草鞋，走过千山万水，印证了行者之路。', readTime: '5 分钟', views: 189 },
];

const hotChapters = [
  { title: '第一章：初入山门', reads: 1234 },
  { title: '莲花的呼吸', reads: 521 },
  { title: '第三章：晨钟暮鼓', reads: 856 },
  { title: '第二章：禅房夜话', reads: 986 },
];

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState<'serial' | 'short'>('serial');

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            行者故事
          </h1>
          <p className="text-[#808080]">长篇连载 · 短篇精读</p>
        </div>

        <div className="flex gap-0 border-b border-[#D4AF37]/20 mb-6">
          <button 
            onClick={() => setActiveTab('serial')} 
            className={`flex-1 md:flex-none px-8 py-3 text-sm font-medium transition-colors border-b-2 ${ 
              activeTab === 'serial' ? 'border-[#D4AF37] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300' 
            }`} 
          >
            📖 长篇连载
          </button>
          <button 
            onClick={() => setActiveTab('short')} 
            className={`flex-1 md:flex-none px-8 py-3 text-sm font-medium transition-colors border-b-2 ${ 
              activeTab === 'short' ? 'border-[#D4AF37] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300' 
            }`} 
          >
            ✨ 短篇精选
          </button>
        </div>

        {activeTab === 'serial' && (
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]/60">SERIAL · 长篇连载</span>
            </div>
            <h2 className="text-2xl font-serif text-white mb-2">山中纪事 · 连载中</h2>
            <div className="space-y-3">
              {serialChapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/muxintang/learn/ebook/${chapter.id}`}
                  className="bg-[#1A1A1A] border border-[#D4AF37]/10 rounded-xl p-5 hover:border-[#D4AF37]/30 transition-colors block"
                >
                  <h3 className="text-white font-bold text-lg mb-2">{chapter.title}</h3>
                  <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{chapter.desc}</p>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{chapter.date}</span>
                    <span className="flex items-center gap-1">👁️ {chapter.reads}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'short' && (
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]/60">SHORT · 短篇精选</span>
            </div>
            <h2 className="text-2xl font-serif text-white mb-2">零散精粹</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shortStories.map((story, idx) => (
                <div key={idx} className="bg-[#1A1A1A] border border-[#D4AF37]/10 rounded-xl p-5 hover:border-[#D4AF37]/30 transition-colors cursor-pointer">
                  <h3 className="text-white font-bold text-lg">{story.title}</h3>
                  <p className="text-zinc-400 text-sm mt-1">{story.sub}</p>
                  <div className="mt-3 text-[#D4AF37]/60 text-xs flex items-center gap-2">
                    <span>{story.readTime}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                    <span>{story.views} 人读过</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-[#D4AF37]/10 pt-6">
          <h3 className="text-[#D4AF37]/80 text-sm font-medium mb-4">🔥 热门章节</h3>
          <div className="flex flex-col gap-3">
            {hotChapters.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/5 rounded px-2 transition-colors">
                <span className="text-white text-sm">{item.title}</span>
                <span className="text-zinc-500 text-xs flex items-center gap-1">
                  <span>👁️</span> {item.reads}
                </span>
              </div>
            ))}
          </div>
        </div>

        <section className="mt-8">
          <Link 
            href="/muxintang/learn/ebooks"
            className="muxintang-card p-6 hover:border-[#D4AF37] transition-all block"
          >
            <div className="flex items-center gap-6">
              <div className="text-5xl">📚</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">会员专属电子书</h3>
                <p className="text-[#808080]">由阿阇梨根据多年修行心得整理而成的珍贵内容</p>
              </div>
              <div className="text-[#D4AF37]">→</div>
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}