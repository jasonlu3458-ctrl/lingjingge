'use client';

/**
 * XuanBlindBoxButton —— 灵境阁盲盒触达工具的统一按钮 + 动画
 *
 * 适用：click-to-reveal 类工具（推背师 / 星座师 / 生肖师）
 *
 * 三种动画（纯 CSS，无外部依赖）：
 *  - 'shake'   摇签筒（rotate ±5° + translateY 抖动）
 *  - 'flip'    翻牌（rotateY 0 → 360°）
 *  - 'spin'    转盘（rotate 0 → 720°）
 *
 * 流程：
 *  1) 用户点击大按钮 → 触发动画（1.5-2s）
 *  2) 动画结束后调用 onResult(result) → 父组件切换到报告卡
 *  3) 父组件可选择再展示"咨询阿阇梨"对话入口
 *
 * 设计灵感：网易测一测"摇一摇" + 塔罗牌翻牌 + 大转盘
 */

import { useState, useRef, useEffect } from 'react';

export type BlindBoxType = 'shake' | 'flip' | 'spin' | 'glow';

export interface XuanBlindBoxButtonProps {
  /** 盲盒类型（决定动画） */
  type: BlindBoxType;
  /** 主标题 */
  title: string;
  /** 副标题（按钮下小字） */
  subtitle?: string;
  /** 头部 emoji */
  icon: string;
  /** 主题色（accent） */
  themeColor: string;
  /** 按钮文案 */
  buttonLabel: string;
  /** 动画时长（ms），默认 1800 */
  duration?: number;
  /** 动画结束后回调，父组件可接收 result 切换 phase */
  onResult: () => void;
  /** 中心图案（点击前显示），默认按 type 渲染 fallback */
  centerNode?: React.ReactNode;
  /** 点击时立即触发的回调（用于父组件发请求），不阻塞动画 */
  onDrawStart?: () => void;
}

const TYPE_LABELS: Record<BlindBoxType, { main: string; icon: string; after: string }> = {
  shake: { main: '签',   icon: '📜', after: '请查收 · 今日一签' },
  flip:  { main: '牌',   icon: '🃏', after: '请查收 · 你的星卡' },
  spin:  { main: '轮',   icon: '🎡', after: '请查收 · 生肖启示' },
  glow:  { main: '光',   icon: '✨', after: '请查收 · 灵光一现' },
};

export default function XuanBlindBoxButton({
  type,
  title,
  subtitle,
  icon,
  themeColor,
  buttonLabel,
  duration = 1800,
  onResult,
  centerNode,
  onDrawStart,
}: XuanBlindBoxButtonProps) {
  const [phase, setPhase] = useState<'idle' | 'drawing' | 'revealed'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = () => {
    if (phase !== 'idle') return;
    setPhase('drawing');
    onDrawStart?.();
    timerRef.current = setTimeout(() => {
      setPhase('revealed');
      onResult();
    }, duration);
  };

  const labels = TYPE_LABELS[type];

  return (
    <div
      className="rounded-2xl border border-amber-200/30 p-6 md:p-10 shadow-2xl flex flex-col items-center justify-center min-h-[480px]"
      style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
      }}
    >
      {/* 头部 */}
      <div className="text-center mb-8">
        <div className="text-3xl md:text-4xl font-semibold text-amber-50 mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          {title}
        </div>
        {subtitle && (
          <p className="text-sm text-amber-200/60 tracking-wider">{subtitle}</p>
        )}
      </div>

      {/* 中心图案 */}
      <div className="relative mb-10" style={{ perspective: '1000px' }}>
        {centerNode ? (
          <div
            className={`
              relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center
              ${phase === 'drawing' ? `xuan-${type}-anim` : ''}
            `}
            onClick={handleClick}
            style={{
              cursor: phase === 'idle' ? 'pointer' : 'default',
              transformStyle: 'preserve-3d',
            }}
          >
            {centerNode}
          </div>
        ) : (
          <div
            onClick={handleClick}
            className={`
              relative w-48 h-48 md:w-56 md:h-56 rounded-3xl flex items-center justify-center
              ${phase === 'drawing' ? `xuan-${type}-anim` : ''}
            `}
            style={{
              cursor: phase === 'idle' ? 'pointer' : 'default',
              background: `radial-gradient(circle, ${themeColor}40 0%, ${themeColor}10 70%, transparent 100%)`,
              border: `2px solid ${themeColor}50`,
              boxShadow: phase === 'idle' ? `0 0 40px ${themeColor}30` : `0 0 60px ${themeColor}60`,
              transformStyle: 'preserve-3d',
              transition: 'box-shadow 0.3s',
            }}
          >
            <div className="text-center">
              <div className="text-6xl md:text-7xl mb-2">{phase === 'drawing' ? '🌀' : labels.icon}</div>
              <div
                className="text-2xl md:text-3xl font-bold tracking-[6px]"
                style={{ color: themeColor, fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {labels.main}
              </div>
            </div>
            {/* 装饰光晕 */}
            {phase === 'idle' && (
              <div
                className="absolute inset-0 rounded-3xl animate-pulse pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${themeColor}10 0%, transparent 70%)`,
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* 按钮 / 状态文字 */}
      {phase === 'idle' && (
        <button
          onClick={handleClick}
          className="px-10 py-4 rounded-full font-semibold text-base md:text-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
            color: '#0a0a0a',
            boxShadow: `0 6px 24px ${themeColor}50, inset 0 1px 0 rgba(255,255,255,0.2)`,
            fontFamily: "'Ma Shan Zheng', cursive, serif",
          }}
        >
          {buttonLabel}
        </button>
      )}

      {phase === 'drawing' && (
        <p
          className="text-amber-100/80 text-lg tracking-widest"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
        >
          ✨ {type === 'shake' ? '签筒摇动中…' : type === 'flip' ? '翻牌中…' : type === 'spin' ? '转盘飞旋中…' : '灵光凝聚中…'} ✨
        </p>
      )}

      {phase === 'revealed' && (
        <p
          className="text-amber-100/70 text-sm"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
        >
          {labels.after}
        </p>
      )}

      {/* 注入 CSS 动画 */}
      <style jsx>{`
        @keyframes xuan-shake-anim {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          10% { transform: rotate(-8deg) translateY(-4px); }
          20% { transform: rotate(8deg) translateY(4px); }
          30% { transform: rotate(-10deg) translateY(-6px); }
          40% { transform: rotate(10deg) translateY(6px); }
          50% { transform: rotate(-8deg) translateY(-4px); }
          60% { transform: rotate(8deg) translateY(4px); }
          70% { transform: rotate(-6deg) translateY(-2px); }
          80% { transform: rotate(6deg) translateY(2px); }
          90% { transform: rotate(-2deg) translateY(0); }
        }
        .xuan-shake-anim {
          animation: xuan-shake-anim 1.6s ease-in-out infinite;
        }
        @keyframes xuan-flip-anim {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(1800deg); }
        }
        .xuan-flip-anim {
          animation: xuan-flip-anim 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-style: preserve-3d;
        }
        @keyframes xuan-spin-anim {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(540deg) scale(1.1); }
          100% { transform: rotate(1080deg) scale(1); }
        }
        .xuan-spin-anim {
          animation: xuan-spin-anim 1.8s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
        }
        @keyframes xuan-glow-anim {
          0%, 100% { box-shadow: 0 0 40px var(--glow-color); opacity: 0.8; }
          50% { box-shadow: 0 0 80px var(--glow-color); opacity: 1; }
        }
        .xuan-glow-anim {
          animation: xuan-glow-anim 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
