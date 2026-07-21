'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';

const MandalaHero = dynamic(() => 
  import('@/components/muxintang/MandalaHero').then(mod => ({ default: mod.MandalaHero })), 
  { ssr: false }
);
const AcharyaFloatingButton = dynamic(() => 
  import('@/components/muxintang/AcharyaFloatingButton').then(mod => ({ default: mod.AcharyaFloatingButton })), 
  { ssr: false }
);

const QUICK_TOOLS = [
  { id: 'bazi', name: '生命代码', icon: '🧬', href: '/muxintang/tools/bazi' },
  { id: 'chooseday', name: '择日智选', icon: '☀️', href: '/muxintang/tools/chooseday' },
  { id: 'trend', name: '运势趋势', icon: '📈', href: '/muxintang/tools/trend' },
];

const MOCK_ARTICLE = {
  id: 1,
  title: '生命密码：八字中的五行平衡之道',
  summary: '从八字看五行，如何找到人生的平衡点。每个人的命盘都蕴含着独特的能量密码，学会解读它们，便能更好地理解自己。',
};

const FEATURED_COLUMN = {
  name: '阿阇梨开示',
  desc: '根本上师的当机说法，以唐密法脉的视角看待一切问题',
};

export default function MuxintangHomePage() {
  const [dailyZen, setDailyZen] = useState('');
  const [checkinStatus, setCheckinStatus] = useState<'idle' | 'loading' | 'checked' | 'error'>('idle');
  const [checkinMessage, setCheckinMessage] = useState('');
  const [showReminder, setShowReminder] = useState(false);
  const [reminderContent, setReminderContent] = useState('');
  const [latestArticle, setLatestArticle] = useState(MOCK_ARTICLE);
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    fetch('/api/daily-zen')
      .then(res => res.json())
      .then(data => setDailyZen(data?.zen || ''))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/user/me')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.profile?.bazi_summary) {
            const bazi = data.profile.bazi_summary;
            if (bazi.includes('火弱') || bazi.includes('火旺')) {
              setReminderContent(`同修，根据您的命盘${bazi.includes('火弱') ? '火弱' : '火旺'}，${bazi.includes('火弱') ? '近期宜往东行，多晒太阳' : '近期宜静心降火，少食辛辣'}`);
              setShowReminder(true);
            }
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetch('/api/articles?tenant_id=muxintang&limit=1')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.length) {
          const article = data.data[0];
          setLatestArticle({
            id: article.id,
            title: article.title,
            summary: article.summary || article.content?.substring(0, 150) || '',
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleCheckin = async () => {
    if (checkinStatus === 'checked' || checkinStatus === 'loading') return;
    setCheckinStatus('loading');
    
    try {
      const res = await fetch('/api/user/points/sign-in', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        setCheckinStatus('checked');
        setCheckinMessage(data.message || '领取成功');
      } else if (res.status === 409) {
        setCheckinStatus('checked');
        setCheckinMessage('今日已签到，明天再来');
      } else {
        setCheckinStatus('error');
        setCheckinMessage(data.error || '签到失败');
      }
    } catch {
      setCheckinStatus('error');
      setCheckinMessage('网络错误，请稍后再试');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] pb-24">
      <MandalaHero />
      
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#121212] to-[#0a0a0a]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-[#D4AF37] rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#8B4513] rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#8B4513] to-[#D4AF37] rounded-full mb-6 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              <span className="text-3xl">🪷</span>
            </div>
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              牧心堂
            </h1>
            <p className="text-xl text-[#C0C0C0] mb-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              心之所向，牧之以道
            </p>
            <p className="text-[#808080] max-w-2xl mx-auto">
              牧心堂阿阇梨，为您提供八字智测、择日吉时、家居环境等传统文化服务
            </p>
          </div>

          <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-[#D4AF37]/20 rounded-2xl p-5 mx-auto max-w-3xl mb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg text-[#D4AF37]">📿</span>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]/60">今日修行</span>
                </div>
                <p className="text-[#C0C0C0] text-sm italic leading-relaxed">
                  {dailyZen || '心无挂碍，无挂碍故，无有恐怖，远离颠倒梦想。——《心经》'}
                </p>
              </div>
              <button
                onClick={handleCheckin}
                disabled={checkinStatus === 'loading' || checkinStatus === 'checked'}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  checkinStatus === 'checked'
                    ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                    : checkinStatus === 'error'
                    ? 'bg-red-900/30 text-red-400 border border-red-500/30'
                    : 'bg-[#D4AF37] text-black hover:opacity-90 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                }`}
              >
                {checkinStatus === 'loading' ? (
                  <>⏳ 领取中...</>
                ) : checkinStatus === 'checked' ? (
                  <>✅ 今日已打卡</>
                ) : (
                  <>💊 领取今日牧心丹</>
                )}
              </button>
            </div>
            {checkinMessage && (
              <p className={`mt-3 text-xs ${checkinStatus === 'checked' ? 'text-green-400' : 'text-red-400'}`}>
                {checkinMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      {showReminder && (
        <section className="py-6 bg-[#121212]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4 flex items-start gap-3">
              <span className="text-xl text-[#D4AF37] flex-shrink-0">💡</span>
              <div>
                <p className="text-[#D4AF37] text-sm font-medium mb-1">阿阇梨的专属提醒</p>
                <p className="text-[#C0C0C0] text-sm">{reminderContent}</p>
                <button
                  onClick={() => setShowReminder(false)}
                  className="mt-2 text-xs text-[#808080] hover:text-white"
                >
                  收起提醒
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xl text-[#D4AF37]">⚡</span>
            <h2 
              className="text-2xl font-bold"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              快速智测
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {QUICK_TOOLS.map((tool) => (
              <Link 
                key={tool.id} 
                href={tool.href}
                className="bg-[#121212] border border-[#222222] rounded-xl p-6 flex items-center gap-4 hover:border-[#D4AF37]/50 transition-all"
              >
                <span className="text-3xl">{tool.icon}</span>
                <span 
                  className="text-lg font-semibold"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
                >
                  {tool.name}
                </span>
              </Link>
            ))}
          </div>
          
          <div className="text-center">
            <Link href="/muxintang/tools" className="text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors inline-flex items-center gap-1">
              查看全部工具 →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#121212]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xl text-[#D4AF37]">📖</span>
            <h2 
              className="text-2xl font-bold"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              今日行者故事
            </h2>
          </div>
          
          <Link 
            href={`/muxintang/learn/ebook/${latestArticle.id}`}
            className="block bg-[#1A1A1A] border border-[#222222] rounded-xl p-6 hover:border-[#D4AF37]/50 transition-all"
          >
            <h3 className="text-white text-xl font-bold mb-3">{latestArticle.title}</h3>
            <p className="text-[#808080] text-sm leading-relaxed mb-4">{latestArticle.summary}</p>
            <span className="inline-flex items-center gap-1 text-[#D4AF37] text-sm">
              点击阅读 →
            </span>
          </Link>
        </div>
      </section>

      <section className="py-16 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xl text-[#D4AF37]">📜</span>
            <h2 
              className="text-2xl font-bold"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              密法灵学
            </h2>
          </div>
          
          <Link 
            href="/muxintang/channel"
            className="block bg-[#1A1A1A] border border-[#222222] rounded-xl p-6 hover:border-[#D4AF37]/50 transition-all"
          >
            <h3 className="text-white text-xl font-bold mb-3">{FEATURED_COLUMN.name}</h3>
            <p className="text-[#808080] text-sm leading-relaxed mb-4">{FEATURED_COLUMN.desc}</p>
            <span className="inline-flex items-center gap-1 text-[#D4AF37] text-sm">
              进入专栏 →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}