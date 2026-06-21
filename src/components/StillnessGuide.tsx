// ============================================================
// StillnessGuide —— 静功引导（站桩 / 坐禅）
// 中心水墨线描占位图 + 丹田呼吸光点 + 倒计时
// 5 分钟后自动回调 onComplete
// ============================================================

'use client';

import { useEffect, useState, useRef, type ReactNode, type MouseEvent } from 'react';
import { formatDuration, BREATH_CYCLE_MS, type BodyType } from '@/lib/body-rules';

export interface StillnessGuideProps {
  type: BodyType; // 'zhanzhuang' | 'zhengqi'
  duration: number; // 秒
  onComplete: (elapsedSec: number) => void;
  onExit: (e?: MouseEvent<HTMLButtonElement>) => void;
}

/** 站桩轮廓 SVG（水墨风，简笔） */
function ZhanzhuangSilhouette(): ReactNode {
  return (
    <svg
      viewBox="0 0 200 360"
      className="w-72 h-[28rem]"
      style={{ opacity: 0.2 }}
      aria-hidden
    >
      {/* 头 */}
      <circle cx="100" cy="40" r="18" fill="none" stroke="#e5e5e5" strokeWidth="1.2" />
      {/* 颈-脊柱 */}
      <line x1="100" y1="58" x2="100" y2="220" stroke="#e5e5e5" strokeWidth="1.2" />
      {/* 肩-臂（半圆抱球） */}
      <path
        d="M 70 110 Q 50 160 70 200"
        fill="none"
        stroke="#e5e5e5"
        strokeWidth="1.2"
      />
      <path
        d="M 130 110 Q 150 160 130 200"
        fill="none"
        stroke="#e5e5e5"
        strokeWidth="1.2"
      />
      {/* 双手（在身前抱球） */}
      <circle cx="80" cy="195" r="6" fill="none" stroke="#e5e5e5" strokeWidth="1.2" />
      <circle cx="120" cy="195" r="6" fill="none" stroke="#e5e5e5" strokeWidth="1.2" />
      {/* 髋-腿 */}
      <line x1="100" y1="220" x2="80" y2="310" stroke="#e5e5e5" strokeWidth="1.2" />
      <line x1="100" y1="220" x2="120" y2="310" stroke="#e5e5e5" strokeWidth="1.2" />
      {/* 脚 */}
      <line x1="70" y1="310" x2="90" y2="310" stroke="#e5e5e5" strokeWidth="1.2" />
      <line x1="110" y1="310" x2="130" y2="310" stroke="#e5e5e5" strokeWidth="1.2" />
    </svg>
  );
}

/** 坐禅轮廓 SVG */
function ZhengqiSilhouette(): ReactNode {
  return (
    <svg
      viewBox="0 0 200 360"
      className="w-72 h-[28rem]"
      style={{ opacity: 0.2 }}
      aria-hidden
    >
      {/* 头（微低） */}
      <circle cx="100" cy="50" r="20" fill="none" stroke="#e5e5e5" strokeWidth="1.2" />
      {/* 颈-脊柱 */}
      <line x1="100" y1="70" x2="100" y2="220" stroke="#e5e5e5" strokeWidth="1.2" />
      {/* 双臂搭膝（结跏趺坐） */}
      <path
        d="M 70 130 Q 50 180 60 220"
        fill="none"
        stroke="#e5e5e5"
        strokeWidth="1.2"
      />
      <path
        d="M 130 130 Q 150 180 140 220"
        fill="none"
        stroke="#e5e5e5"
        strokeWidth="1.2"
      />
      {/* 双手（叠掌于腹前） */}
      <ellipse cx="100" cy="225" rx="20" ry="6" fill="none" stroke="#e5e5e5" strokeWidth="1.2" />
      {/* 双腿（盘坐） */}
      <path
        d="M 60 220 Q 100 260 140 220"
        fill="none"
        stroke="#e5e5e5"
        strokeWidth="1.2"
      />
      {/* 座垫 */}
      <ellipse cx="100" cy="290" rx="80" ry="10" fill="none" stroke="#e5e5e5" strokeWidth="1.2" />
    </svg>
  );
}

export default function StillnessGuide({ type, duration, onComplete, onExit }: StillnessGuideProps): ReactNode {
  const [remaining, setRemaining] = useState<number>(duration);
  const completedRef = useRef<boolean>(false);

  // 倒计时
  useEffect(() => {
    const start = Date.now();
    const totalMs = duration * 1000;
    const id = window.setInterval(() => {
      const elapsedMs = Date.now() - start;
      const left = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000));
      setRemaining(left);
      if (elapsedMs >= totalMs) {
        window.clearInterval(id);
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete(duration);
        }
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [duration, onComplete]);

  const title = type === 'zhanzhuang' ? '混元桩 · 站桩' : '真气运行法 · 坐禅';
  const guide = type === 'zhanzhuang' ? '两脚平肩宽，屈膝下蹲；双手如抱球，意守丹田。' : '盘膝而坐，调息绵长；引气下沉，意随息行。';
  const isZhanzhuang = type === 'zhanzhuang';

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] text-white overflow-hidden">
      {/* 退出按钮 */}
      <button
        type="button"
        onClick={onExit}
        className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-md text-xs text-gray-400 border border-white/10 hover:border-white/30 hover:text-white transition"
      >
        退出
      </button>

      {/* 顶部标题 */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center z-10">
        <h2
          className="text-2xl font-bold tracking-widest"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif", color: isZhanzhuang ? '#86efac' : '#7dd3fc' }}
        >
          {title}
        </h2>
        <p className="mt-2 text-xs text-gray-500 tracking-widest">{guide}</p>
      </div>

      {/* 中心图形 + 丹田呼吸光点 */}
      <div className="relative flex items-center justify-center" style={{ width: 320, height: 480 }}>
        {/* 水墨线描占位图 */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isZhanzhuang ? <ZhanzhuangSilhouette /> : <ZhengqiSilhouette />}
        </div>

        {/* 丹田位置呼吸光点（站桩：下腹；坐禅：腹前） */}
        <div
          className="absolute"
          style={{
            top: isZhanzhuang ? '58%' : '63%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(180,200,220,0.4) 40%, rgba(0,0,0,0) 70%)',
            boxShadow: '0 0 30px 8px rgba(180,200,220,0.5), 0 0 60px 20px rgba(180,200,220,0.2)',
            animation: `bodyBreath ${BREATH_CYCLE_MS}ms ease-in-out infinite`,
          }}
          aria-hidden
        />
      </div>

      {/* 底部倒计时 */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center z-10">
        <div
          className="text-5xl font-light tracking-widest tabular-nums"
          style={{ color: isZhanzhuang ? '#86efac' : '#7dd3fc' }}
        >
          {formatDuration(remaining)}
        </div>
        <p className="mt-2 text-xs text-gray-500 tracking-widest">凝神 · 静气 · 归一</p>
      </div>

      {/* 呼吸动画 keyframes（局部样式） */}
      <style>{`
        @keyframes bodyBreath {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
          50%      { transform: translate(-50%, -50%) scale(2.6); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
