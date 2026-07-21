'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const COLUMNS = [
  { id: 'lifecode', name: '生命格局', icon: '☰', desc: '从八字到数字命理，认识自己。', articles: 2 },
  { id: 'habitat', name: '家居环境', icon: '☯', desc: '风水堪舆与现代居住的和解。', articles: 2 },
  { id: 'name', name: '姓名心解', icon: '✍️', desc: '一个字，便是一生的回响。', articles: 2 },
  { id: 'acharya', name: '阿阇梨开示', icon: '🧘', desc: '根本上师的当机说法。', articles: 2 },
];

const ARTICLES = [
  { id: 1, title: '八字排盘入门指南', category: 'lifecode', author: '任书颖阿阇梨', reads: 1250, likes: 89, date: '2024-01-15' },
  { id: 2, title: '生命密码中的五行平衡', category: 'lifecode', author: '任书颖阿阇梨', reads: 890, likes: 67, date: '2024-01-14' },
  { id: 3, title: '玄空风水九星飞泊详解', category: 'habitat', author: '王师傅', reads: 650, likes: 45, date: '2024-01-13' },
  { id: 4, title: '家居气场优化指南', category: 'habitat', author: '王师傅', reads: 780, likes: 56, date: '2024-01-12' },
  { id: 5, title: '姓名学中的五行配置', category: 'name', author: '李相师', reads: 920, likes: 72, date: '2024-01-11' },
  { id: 6, title: '起名改名的艺术', category: 'name', author: '李相师', reads: 1100, likes: 88, date: '2024-01-10' },
  { id: 7, title: '唐密传承与现代修行', category: 'acharya', author: '阿阇梨', reads: 1300, likes: 95, date: '2024-01-09' },
  { id: 8, title: '根本上师的当机说法', category: 'acharya', author: '阿阇梨', reads: 1500, likes: 110, date: '2024-01-08' },
];

const CHECKIN_RECORDS = [
  { id: 1, user: '缘主小李', date: '2024-01-15', progress: '阅读《八字排盘入门》第3章', points: '+20' },
  { id: 2, user: '缘主王芳', date: '2024-01-15', progress: '完成《风水探秘》研读', points: '+50' },
  { id: 3, user: '缘主刘八', date: '2024-01-14', progress: '学习《择日通论》', points: '+30' },
  { id: 4, user: '缘主赵六', date: '2024-01-14', progress: '打卡《姓名学》', points: '+10' },
];

export default function ChannelPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [checkedIn, setCheckedIn] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && COLUMNS.some(c => c.id === category)) {
      setActiveCategory(category);
    } else {
      setActiveCategory('all');
    }
  }, [searchParams]);

  const filteredArticles = activeCategory === 'all' 
    ? ARTICLES 
    : ARTICLES.filter(a => a.category === activeCategory);

  const handleCheckin = () => {
    setCheckedIn(true);
    setTimeout(() => setCheckedIn(false), 3000);
  };

  const getCategoryName = (id: string) => {
    const col = COLUMNS.find(c => c.id === id);
    return col?.name || id;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            密法灵学
          </h1>
          <p className="text-[#808080]">显真言 · 合五行 · 破无明</p>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl text-[#D4AF37]">📖</span>
            <h2 className="text-2xl font-serif text-white">密解专栏</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COLUMNS.map((col) => (
              <Link
                key={col.id}
                href={`/muxintang/channel?category=${col.id}`}
                className="bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-xl p-6 hover:border-[#D4AF37]/60 transition-colors group relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl text-[#D4AF37]">{col.icon}</span>
                    <h3 className="text-white text-lg font-bold">{col.name}</h3>
                  </div>
                  <span className="text-[#D4AF37]/30 text-xs uppercase tracking-wider">{col.id.toUpperCase()}</span>
                </div>
                <p className="text-zinc-400 text-sm mb-4">{col.desc}</p>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">{col.articles} 篇文章</span>
                  <span className="text-[#D4AF37] text-sm group-hover:translate-x-1 transition-transform">进入 →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 
              className="text-2xl font-semibold"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              📖 {activeCategory === 'all' ? '推荐文章' : `${getCategoryName(activeCategory)} · 文章列表`}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  activeCategory === 'all'
                    ? 'bg-[#8B4513] text-[#D4AF37]'
                    : 'bg-[#242424] text-[#808080] hover:bg-[#333333]'
                }`}
              >
                全部
              </button>
              {COLUMNS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setActiveCategory(col.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    activeCategory === col.id
                      ? 'bg-[#8B4513] text-[#D4AF37]'
                      : 'bg-[#242424] text-[#808080] hover:bg-[#333333]'
                  }`}
                >
                  {col.name}
                </button>
              ))}
            </div>
          </div>

          {filteredArticles.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/muxintang/channel/article/${article.id}`}
                  className="muxintang-card p-6 hover:border-[#D4AF37] transition-all"
                >
                  <h3 className="text-white font-medium mb-3 line-clamp-2">{article.title}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-[#D4AF37]">{article.author}</span>
                      <span className="text-[#808080]">{article.date}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[#808080]">
                      <span>👁️ {article.reads}</span>
                      <span>❤️ {article.likes}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-[#808080]">暂无该分类文章</p>
              <button
                onClick={() => setActiveCategory('all')}
                className="mt-4 px-6 py-2 border border-[#D4AF37]/50 text-[#D4AF37] rounded-xl hover:bg-[#D4AF37]/10 transition-all"
              >
                查看全部文章
              </button>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 
              className="text-2xl font-semibold"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              ✨ 研读打卡
            </h2>
            <button
              onClick={handleCheckin}
              disabled={checkedIn}
              className={`px-6 py-2 rounded-lg transition-all ${
                checkedIn
                  ? 'bg-green-900/50 text-green-400 cursor-not-allowed'
                  : 'bg-[#8B4513] text-[#D4AF37] hover:bg-[#A0522D]'
              }`}
            >
              {checkedIn ? '今日已打卡' : '立即打卡'}
            </button>
          </div>

          <div className="muxintang-card p-6">
            <div className="space-y-4">
              {CHECKIN_RECORDS.map((record) => (
                <div 
                  key={record.id}
                  className="flex items-center justify-between py-3 border-b border-[#333333]/50 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B4513] flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{record.user.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{record.user}</p>
                      <p className="text-sm text-[#808080]">{record.progress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[#D4AF37] font-medium">{record.points}</span>
                    <span className="text-xs text-[#555555]">{record.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}