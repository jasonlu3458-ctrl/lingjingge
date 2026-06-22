'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Solar } from 'lunar-javascript';
import SplashCard from '@/components/SplashCard';
import { FadeIn, SlideIn, StaggerContainer, StaggerItem, HoverScale } from '@/components/Animations';
import ZenAvatar from '@/components/ZenAvatar';

interface DailyZenData {
  zen: string;
  source?: string;
}

export default function SplashPage() {
  const [mounted, setMounted] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // 今日禅机
  const [dailyZen, setDailyZen] = useState<DailyZenData | null>(null);

  useEffect(() => {
    setMounted(true);
    const timer1 = setTimeout(() => setShowText(true), 1200);
    const timer2 = setTimeout(() => setShowButton(true), 2200);

    // 拉取 /api/daily-zen
    fetch('/api/daily-zen')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DailyZenData | null) => {
        if (data && data.zen) setDailyZen(data);
      })
      .catch(() => { /* 静默：禅机只是锦上添花 */ });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // 干支日（如「甲辰年五月廿八」）
  const lunarLabel = (() => {
    try {
      const d = new Date();
      // lunar-javascript 1.x：Solar.fromDate(d).getLunar()
      // 该库无官方 .d.ts，统一用 any 规避 tsc 校验
      const solar: any = Solar;
      const lunar: any = solar.fromDate(d).getLunar();
      const yearGz = lunar.getYearInGanZhi();
      const monthCn = lunar.getMonthInChinese();
      const dayCn = lunar.getDayInChinese();
      return `${yearGz}年${monthCn}月${dayCn}`;
    } catch {
      const d = new Date();
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    }
  })();

  // 解析禅机：分隔主句与出处
  const parsedZen = (() => {
    if (!dailyZen?.zen) return { text: '心若止水，万象自明。', source: '灵境阁' };
    const parts = dailyZen.zen.split(/——|—/);
    return {
      text: parts[0]?.trim() || dailyZen.zen,
      source: parts[1]?.trim() || dailyZen.source || '灵境阁',
    };
  })();

  // 平滑滚动到卡片区域
  const scrollToCards = () => {
    document.getElementById('card-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // 横幅「体验」按钮：滚动到第一张卡片并触发呼吸动画
  const handleExperienceClick = () => {
    const card = document.getElementById('first-card');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('animate-pulse');
    setTimeout(() => card.classList.remove('animate-pulse'), 3000);
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#f5f0eb]" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f0eb] relative overflow-x-hidden">
      {/* ===== 第一屏：水墨晕染 ===== */}
      <div className="min-h-screen flex flex-col items-center justify-center relative px-4 text-center">
        {/* 宣纸纹理背景 */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px'
          }}
        />

        {/* 水墨滴落动画层 */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 主墨滴 - 扩散涟漪 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(44,44,44,0.3)] bg-gradient-to-br from-[rgba(44,44,44,0.08)] via-[rgba(44,44,44,0.03)] to-transparent animate-[rippleExpand1_2.5s_ease-out_forwards]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(44,44,44,0.3)] bg-gradient-to-br from-[rgba(44,44,44,0.08)] via-[rgba(44,44,44,0.03)] to-transparent animate-[rippleExpand2_3s_ease-out_forwards_0.3s]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(44,44,44,0.3)] bg-gradient-to-br from-[rgba(44,44,44,0.08)] via-[rgba(44,44,44,0.03)] to-transparent animate-[rippleExpand3_3.5s_ease-out_forwards_0.6s]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(44,44,44,0.3)] bg-gradient-to-br from-[rgba(44,44,44,0.08)] via-[rgba(44,44,44,0.03)] to-transparent animate-[rippleExpand4_4s_ease-out_forwards_0.9s]" />
          </div>
          
          {/* 辅助墨滴 - 从不同位置滴落 */}
          <div className="absolute top-[30%] left-[25%] w-[200px] h-[200px] rounded-full bg-gradient-to-br from-[rgba(44,44,44,0.12)] via-[rgba(44,44,44,0.05)] to-transparent animate-[dropExpand1_3s_ease-out_forwards_0.5s]" />
          <div className="absolute top-[60%] left-[70%] w-[250px] h-[250px] rounded-full bg-gradient-to-br from-[rgba(44,44,44,0.12)] via-[rgba(44,44,44,0.05)] to-transparent animate-[dropExpand2_3.5s_ease-out_forwards_0.8s]" />
          <div className="absolute top-[20%] left-[65%] w-[180px] h-[180px] rounded-full bg-gradient-to-br from-[rgba(44,44,44,0.12)] via-[rgba(44,44,44,0.05)] to-transparent animate-[dropExpand3_4s_ease-out_forwards_1.2s]" />
          <div className="absolute top-[75%] left-[20%] w-[220px] h-[220px] rounded-full bg-gradient-to-br from-[rgba(44,44,44,0.12)] via-[rgba(44,44,44,0.05)] to-transparent animate-[dropExpand4_3.8s_ease-out_forwards_1.5s]" />
          <div className="absolute top-[45%] left-[15%] w-[150px] h-[150px] rounded-full bg-gradient-to-br from-[rgba(44,44,44,0.12)] via-[rgba(44,44,44,0.05)] to-transparent animate-[dropExpand5_3.2s_ease-out_forwards_1s]" />
          
          {/* 墨点飞溅效果 */}
          <div className="absolute top-[52%] left-[48%] w-1 h-1 rounded-full bg-[rgba(44,44,44,0.15)] animate-[splash1_1.5s_ease-out_forwards_0.2s]" />
          <div className="absolute top-[48%] left-[52%] w-[3px] h-[3px] rounded-full bg-[rgba(44,44,44,0.15)] animate-[splash2_1.5s_ease-out_forwards_0.3s]" />
          <div className="absolute top-[51%] left-[51%] w-[5px] h-[5px] rounded-full bg-[rgba(44,44,44,0.15)] animate-[splash3_1.5s_ease-out_forwards_0.25s]" />
        </div>

        {/* 内容层 */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {/* LOGO */}
          <div className={`mb-4 ${showText ? 'opacity-100' : 'opacity-0'} transition-opacity duration-[1.5s]`}>
            <Image 
              src="/images/logo.png" 
              alt="灵境阁" 
              width={100} 
              height={100} 
              className="rounded-full opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>
          
          <div className="flex flex-col items-center">
            <h1 className={`font-serif text-6xl md:text-7xl text-[#2c2c2c] tracking-[20px] mb-5 ${showText ? 'opacity-100' : 'opacity-0'} transition-opacity duration-[1.5s]`} style={{ textShadow: '2px 2px 4px rgba(44, 44, 44, 0.08)', fontFamily: '"Ma Shan Zheng", "STKaiti", "KaiTi", serif' }}>
              向内观，自有灵山
            </h1>
            <div className={`w-[150px] h-[2px] bg-gradient-to-r from-transparent via-[#2c2c2c] to-transparent ${showText ? 'opacity-50 scale-x-100' : 'opacity-0 scale-x-0'} transition-all duration-1000 delay-500`} />
          </div>
          
          <p className={`text-base md:text-lg text-[#3a3a3a] max-w-md mt-8 mb-10 leading-relaxed tracking-[10px] ${showText ? 'opacity-100' : 'opacity-0'} transition-opacity duration-[1.5s] delay-800`}>
            你的AI心智伙伴，陪你在喧嚣中，找到内心的清净道场。
          </p>
          
          {showButton && (
            <button
              onClick={scrollToCards}
              className="px-14 py-3.5 bg-[#2c2c2c] text-[#f5f0eb] rounded-full text-lg tracking-[10px] shadow-[0_6px_24px_rgba(44,44,44,0.18)] hover:bg-[#3a3a3a] hover:shadow-lg hover:scale-105 transition-all duration-300 animate-[btnFadeIn_0.8s_ease-out_forwards]"
            >
              开启心智之旅
            </button>
          )}
        </div>

        {/* 动画关键帧样式 */}
        <style>{`
          @keyframes coreForm {
            0% { width: 0; height: 0; opacity: 1; }
            50% { opacity: 1; }
            100% { width: 20px; height: 20px; opacity: 0.8; }
          }
          
          @keyframes rippleExpand1 {
            0% { width: 0; height: 0; opacity: 1; }
            100% { width: 300px; height: 300px; opacity: 0; }
          }
          
          @keyframes rippleExpand2 {
            0% { width: 0; height: 0; opacity: 0.8; }
            100% { width: 450px; height: 450px; opacity: 0; }
          }
          
          @keyframes rippleExpand3 {
            0% { width: 0; height: 0; opacity: 0.6; }
            100% { width: 600px; height: 600px; opacity: 0; }
          }
          
          @keyframes rippleExpand4 {
            0% { width: 0; height: 0; opacity: 0.4; }
            100% { width: 750px; height: 750px; opacity: 0; }
          }
          
          @keyframes dropExpand1 {
            0% { width: 0; height: 0; opacity: 0.8; }
            100% { width: 200px; height: 200px; opacity: 0; }
          }
          
          @keyframes dropExpand2 {
            0% { width: 0; height: 0; opacity: 0.7; }
            100% { width: 250px; height: 250px; opacity: 0; }
          }
          
          @keyframes dropExpand3 {
            0% { width: 0; height: 0; opacity: 0.6; }
            100% { width: 180px; height: 180px; opacity: 0; }
          }
          
          @keyframes dropExpand4 {
            0% { width: 0; height: 0; opacity: 0.5; }
            100% { width: 220px; height: 220px; opacity: 0; }
          }
          
          @keyframes dropExpand5 {
            0% { width: 0; height: 0; opacity: 0.65; }
            100% { width: 150px; height: 150px; opacity: 0; }
          }
          
          @keyframes splash1 {
            0% { width: 4px; height: 4px; opacity: 0.8; transform: translate(-50%, -50%); }
            100% { width: 8px; height: 8px; opacity: 0; transform: translate(-150%, -100%); }
          }
          
          @keyframes splash2 {
            0% { width: 3px; height: 3px; opacity: 0.7; transform: translate(-50%, -50%); }
            100% { width: 6px; height: 6px; opacity: 0; transform: translate(50%, -150%); }
          }
          
          @keyframes splash3 {
            0% { width: 5px; height: 5px; opacity: 0.9; transform: translate(-50%, -50%); }
            100% { width: 10px; height: 10px; opacity: 0; transform: translate(100%, 50%); }
          }
          
          @keyframes btnFadeIn {
            from { opacity: 0; transform: translateY(25px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>

      {/* ===== 第二屏：四张卡片 + 灵境阁 IP ===== */}
      <section id="card-section" className="min-h-screen bg-[#faf8f5] py-20 flex flex-col justify-center">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <h2
              className="text-center text-2xl md:text-4xl text-[#3a3a3a] mb-3 font-serif tracking-wider"
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
            >
              {(() => {
                const hour = new Date().getHours();
                if (hour < 6) return "夜深人静，灵境尊者陪你静修";
                if (hour < 12) return "晨光初照，灵境尊者陪你问道";
                if (hour < 18) return "日间纷扰，灵境尊者陪你澄心";
                return "暮色四合，灵境尊者陪你内观";
              })()}
            </h2>
            <p
              className="text-center text-sm md:text-base text-[#7a7a7a] mb-10 font-serif"
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
            >
              解惑 · 内观 · 藏经 · 同修 —— 四大入口，归于一心
            </p>
          </FadeIn>

          {/* 免费试修横幅 —— 灵境行者剪影 + 黑色胶囊按钮 */}
          <div className="max-w-3xl mx-auto w-full mb-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#e8e0d0] shadow-sm">
              <div className="flex items-center gap-4 min-w-0">
                <ZenAvatar size={56} opacity={0.35} />
                <div className="min-w-0">
                  <div
                    className="text-base md:text-lg font-serif text-[#2c2c2c] mb-0.5"
                    style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif", letterSpacing: '1px' }}
                  >
                    免费试修
                  </div>
                  <div className="text-xs md:text-sm text-[#5a5a5a] leading-relaxed">
                    AI 智能顾问初相见，先与你试修一课 —— 一段对话，一次照见
                  </div>
                </div>
              </div>
              <button
                onClick={handleExperienceClick}
                className="flex-shrink-0 h-10 px-5 inline-flex items-center justify-center bg-[#1a1a1a] text-white rounded-full text-sm font-medium hover:bg-[#2c2c2c] transition-colors min-h-[44px]"
                style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif", letterSpacing: '1px' }}
              >
                立即体验 →
              </button>
            </div>
          </div>

          {/* 四张卡片：移动 1 列 / md 2 列 / lg 4 列 */}
          <StaggerContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StaggerItem>
                <HoverScale>
                  <SplashCard
                    id="first-card"
                    zenIcon
                    title="澄心问道"
                    description="AI陪你静心，共同问道，解开灵性困惑"
                    buttonText="去体验 →"
                    href="/wen/chan/ai-zen-master"
                  />
                </HoverScale>
              </StaggerItem>
              <StaggerItem>
                <HoverScale>
                  <SplashCard
                    icon="🔮"
                    title="鉴己观我"
                    description="AI帮你照见，鉴己求真，看清自己"
                    buttonText="去体验 →"
                    href="/guan/lifecode"
                  />
                </HoverScale>
              </StaggerItem>
              <StaggerItem>
                <HoverScale>
                  <SplashCard
                    icon="📜"
                    title="阅藏解惑"
                    description="AI为你解惑，藏经阁原文译文对照"
                    buttonText="去参读 →"
                    href="/zang/library"
                  />
                </HoverScale>
              </StaggerItem>
              <StaggerItem>
                <HoverScale>
                  <SplashCard
                    icon="🫂"
                    title="同心同修"
                    description="加入同修社区，与同道中人共修打卡"
                    buttonText="去同行 →"
                    href="/tong"
                  />
                </HoverScale>
              </StaggerItem>
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* ===== 第三屏：今日禅机 ===== */}
      <section
        id="daily-zen-section"
        className="py-20 px-4"
        style={{ background: 'linear-gradient(180deg, #faf8f5 0%, #f5f0eb 100%)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <div className="text-xs tracking-[6px] text-[#8a8a8a] mb-4" style={{ fontFamily: "'Ma Shan Zheng', serif" }}>
              {lunarLabel} · 灵境阁言
            </div>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#2c2c2c] to-transparent mx-auto mb-8 opacity-40" />
            <blockquote
              className="text-2xl md:text-3xl text-[#2c2c2c] leading-loose font-light italic mb-6"
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif", letterSpacing: '2px' }}
            >
              「{parsedZen.text}」
            </blockquote>
            <p className="text-sm text-[#7a7a7a] mb-10" style={{ fontFamily: "'Ma Shan Zheng', serif" }}>
              —— {parsedZen.source}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
              <Link
                href="/zang/library"
                className="px-5 py-2 rounded-full border border-[#2c2c2c] text-[#2c2c2c] hover:bg-[#2c2c2c] hover:text-white transition-colors"
                style={{ fontFamily: "'Ma Shan Zheng', serif", letterSpacing: '1px' }}
              >
                📖 参读藏经
              </Link>
              <button
                onClick={() => document.getElementById('card-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-5 py-2 rounded-full bg-[#2c2c2c] text-white hover:bg-[#3a3a3a] transition-colors"
                style={{ fontFamily: "'Ma Shan Zheng', serif", letterSpacing: '1px' }}
              >
                🧘 开启对话 →
              </button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
