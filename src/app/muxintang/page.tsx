'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import ZenAvatar from '@/components/ZenAvatar';
import { MandalaHero } from '@/components/muxintang/MandalaHero';
import StarrySky from '@/components/muxintang/StarrySky';

const QUICK_TOOLS = [
  { id: 'bazi', name: '生命代码', icon: '🧬', href: '/muxintang/tools/bazi' },
  { id: 'chooseday', name: '择日智选', icon: '☀️', href: '/muxintang/tools/chooseday' },
  { id: 'trend', name: '运势趋势', icon: '📈', href: '/muxintang/tools/trend' },
];

// 静态示例文章（/api/articles 列表接口尚未实现，先用静态内容兜底）
const LATEST_ARTICLE = {
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
  const isAuthenticated = useIsAuthenticated();

  // ✨ 山门展开：内容区进入视口时浮出
  const contentRef = useRef(null);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setContentVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '-80px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  // ✨ 第一层：1.5s 后自动滚动至第二屏，引导用户进入今日修行
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollBy({ top: window.innerHeight * 0.4, behavior: 'smooth' });
    }, 1500);
    return () => clearTimeout(timer);
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
    <div className="relative min-h-screen bg-transparent pb-24">
      {/* ✨ Layer -40: 玄黑底色（最深层） */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{ zIndex: -40 }}>
        <div className="absolute inset-0 bg-[#0A0A0A]" />
      </div>

      {/* ✨ Layer -2: Canvas 动态星空（星云 + 星星 + 粒子 + 流星） */}
      <StarrySky />

      {/* ✨ Layer -1: MandalaHero (曼荼罗，位于星空之上) */}
      <MandalaHero />

      {/* ✨ 山门：全屏沉浸入口 - 曼荼罗 + 莲花Logo + 牧心堂标题 + 副标题 + 金色光晕 */}
      <section className="relative h-screen flex flex-col justify-center items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#121212]/50 to-[#0a0a0a]/50" />
        {/* ✨ 山门金色光晕 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/8 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-[#D4AF37] rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#8B4513] rounded-full blur-[120px]" />
        </div>

        {/* ✨ 中央呼吸光晕（曼荼罗核心）：用 radial-gradient 配合 animate-pulse 缓慢明暗 */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] -z-10 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.18) 0%, rgba(139,69,19,0.08) 30%, rgba(0,0,0,0) 65%)',
            filter: 'blur(40px)',
          }}
        >
          <div
            className="w-full h-full rounded-full animate-pulse"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(240,215,126,0.25) 0%, rgba(212,175,55,0.10) 40%, transparent 70%)',
              animationDuration: '6s',
            }}
          />
        </div>

        <div className="relative z-10 text-center px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent backdrop-blur-sm border border-[#D4AF37]/30 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.15)] mb-6 animate-pulse-slow">
            <span
              className="text-5xl md:text-6xl font-serif text-[#D4AF37] tracking-widest drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            >
              心
            </span>
          </div>
          <h1
            className="text-5xl md:text-7xl font-serif text-[#D4AF37] tracking-widest mt-4 mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.15)]"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            牧心堂
          </h1>
          <p
            className="text-[#A0A0A0] text-sm md:text-base mt-2 tracking-wider"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            心之所向，牧之以道
          </p>
        </div>
      </section>

      {/* ✨ 山门展开：内容区滚动浮出 */}
      <section
        ref={contentRef}
        className={`transition-all duration-700 ease-out ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
      >

      {/* ✨ 第二层：今日修行 + 签到区 */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-[#D4AF37]/20 rounded-2xl p-5">
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

            {/* ✨ 打卡成功：莲花绽放微动画（scale + opacity pulse） */}
            {checkinStatus === 'checked' && (
              <div className="mt-4 flex justify-center">
                <div
                  className="text-3xl"
                  style={{
                    animation: 'muxLotusBloom 1.8s ease-in-out infinite',
                    transformOrigin: 'center',
                  }}
                >
                  🪷
                </div>
                <style>{`
                  @keyframes muxLotusBloom {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.25); opacity: 1; }
                  }
                `}</style>
              </div>
            )}

            {/* ✨ 抽一签：右侧独立金色胶囊按钮 */}
            <div className="mt-4 flex justify-end">
              <Link
                href="/muxintang/tools/chooseday"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] transition-all text-xs"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '1px' }}
              >
                📜 今日抽一签 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ✨ 第三层：阿阇梨提醒（左侧带 ZenAvatar） */}
      {showReminder && (
        <section className="py-6 bg-[#121212]/60 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4 flex items-start gap-3">
              <ZenAvatar size={32} opacity={0.8} className="mt-0.5" />
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

      {/* ✨ 第四层：今日推荐 - 整合快速智测3卡片 + 行者故事 + 密法灵学 */}
      <section className="py-12 bg-[#0a0a0a]/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xl text-[#D4AF37]">✨</span>
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              今日推荐
            </h2>
          </div>

          {/* ✨ 横向呼吸感留白 */}
          <div className="h-10 md:h-14" aria-hidden />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 快速智测 3 个工具卡片 */}
            {QUICK_TOOLS.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="bg-[#121212] border border-[#222222] rounded-xl p-6 hover:border-[#D4AF37]/50 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{tool.icon}</span>
                  <span
                    className="text-lg font-semibold"
                    style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
                  >
                    {tool.name}
                  </span>
                </div>
                <p className="text-[#808080] text-xs leading-relaxed line-clamp-2">
                  点击进入工具，获取专属解读
                </p>
              </Link>
            ))}

            {/* 今日行者故事卡片 */}
            <Link
              href={`/muxintang/learn/ebook/${LATEST_ARTICLE.id}`}
              className="bg-[#121212] border border-[#222222] rounded-xl p-6 hover:border-[#D4AF37]/50 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📖</span>
                <span
                  className="text-lg font-semibold"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
                >
                  今日行者故事
                </span>
              </div>
              <p className="text-white text-sm font-bold mb-1 line-clamp-1">{LATEST_ARTICLE.title}</p>
              <p className="text-[#808080] text-xs leading-relaxed line-clamp-2">{LATEST_ARTICLE.summary}</p>
            </Link>

            {/* 密法灵学卡片 */}
            <Link
              href="/muxintang/channel"
              className="bg-[#121212] border border-[#222222] rounded-xl p-6 hover:border-[#D4AF37]/50 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📜</span>
                <span
                  className="text-lg font-semibold"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
                >
                  密法灵学
                </span>
              </div>
              <p className="text-white text-sm font-bold mb-1 line-clamp-1">{FEATURED_COLUMN.name}</p>
              <p className="text-[#808080] text-xs leading-relaxed line-clamp-2">{FEATURED_COLUMN.desc}</p>
            </Link>
          </div>

          {/* ✨ 极细淡金色分隔线，让网格与下方入口自然过渡 */}
          <div
            aria-hidden
            className="w-full h-px my-6"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.25) 50%, transparent 100%)' }}
          />

          {/* ✨ 「查看全部工具」入口 */}
          <Link
            href="/muxintang/tools"
            className="group mt-4 block bg-gradient-to-r from-[#121212] via-[#1A1A1A] to-[#1A1A1A] border border-[#222222] hover:border-[#D4AF37]/50 rounded-xl p-5 transition-all relative overflow-hidden"
          >
            <div
              aria-hidden
              className="absolute inset-y-0 right-0 w-1/2 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity"
              style={{
                background:
                  'radial-gradient(ellipse at right center, rgba(212,175,55,0.25) 0%, rgba(139,69,19,0.10) 40%, transparent 75%)',
              }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧰</span>
                <div>
                  <p
                    className="text-base font-semibold"
                    style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
                  >
                    查看全部工具
                  </p>
                  <p className="text-xs text-[#808080] mt-0.5">
                    八字 · 婚配 · 取名 · 择日 · 家居 · 流年
                  </p>
                </div>
              </div>
              <span
                className="text-[#D4AF37] text-xl transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              >
                →
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ✨ 第五层：返回顶部 */}
      <div className="py-8 flex justify-center">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#121212] border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] transition-all"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '1px' }}
        >
          ↑ 返回顶部
        </button>
      </div>
      </section>
    </div>
  );
}
