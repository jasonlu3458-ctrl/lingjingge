'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * ZenSoundToggle —— 禅音背景音乐开关
 *
 * 设计要点：
 *  - 跨页面共享一个 <audio> 元素（模块级单例），保证切换路由不中断
 *  - 默认静音；用户首次点击按钮才播放（autoplay policy）
 *  - 用户偏好持久化到 localStorage，跨会话保留
 *  - 进度写入不阻塞 UI
 *
 * 按钮可放在 Navbar 任意位置。本组件自带 SVG 图标 + 三态动画。
 */

const STORAGE_KEY = 'zen:ambient:enabled';
const SRC = '/audio/zen-ambient.mp3';
const VOLUME = 0.35;

// 模块级共享 <audio>：路由切换不中断播放
let _audio: HTMLAudioElement | null = null;
function getAudio(): HTMLAudioElement {
  if (typeof window === 'undefined') {
    return { pause() {}, play() {}, src: '' } as any;
  }
  if (!_audio) {
    _audio = new Audio(SRC);
    _audio.loop = true;
    _audio.preload = 'auto';
    _audio.volume = VOLUME;
  }
  return _audio;
}

export interface ZenSoundToggleProps {
  /** 沉浸式模式（深色背景上用浅色图标） */
  immersive?: boolean;
  /** 额外 className */
  className?: string;
}

export default function ZenSoundToggle({
  immersive = false,
  className = '',
}: ZenSoundToggleProps) {
  // SSR 安全：mounted 之前不渲染交互（避免水合不一致）
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);

  // 防止两个组件实例同时 toggle 时的竞态
  const seqRef = useRef(0);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY) === '1';
      setEnabled(stored);
      if (stored) {
        // 用户上次开过 → 自动尝试续播（autoplay policy 可能失败，但不会报错）
        const a = getAudio();
        a.play().catch(() => undefined);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(async () => {
    const mySeq = ++seqRef.current;
    const a = getAudio();
    if (a.paused) {
      try {
        await a.play();
        if (mySeq !== seqRef.current) return;
        setEnabled(true);
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
      } catch (e) {
        // autoplay 阻断
        setEnabled(false);
      }
    } else {
      a.pause();
      a.currentTime = 0;
      setEnabled(false);
      try { localStorage.setItem(STORAGE_KEY, '0'); } catch { /* ignore */ }
    }
  }, []);

  // 卸载时不停止 audio（保持后台续播）

  if (!mounted) {
    // 占位：避免水合闪烁
    return (
      <span
        aria-hidden
        className={`inline-block w-9 h-9 rounded-full ${className}`}
      />
    );
  }

  const iconColor = immersive ? 'text-white/85' : 'text-[#2c2c2c]';
  const ringColor = enabled
    ? immersive
      ? 'border-white/70 bg-white/10 shadow-[0_0_18px_rgba(255,255,255,0.35)]'
      : 'border-amber-500 bg-amber-50 shadow-[0_0_14px_rgba(245,158,11,0.35)]'
    : immersive
      ? 'border-white/25 hover:border-white/50 hover:bg-white/5'
      : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50/50';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? '关闭禅音' : '开启禅音'}
      title={enabled ? '关闭禅音背景' : '开启禅音背景'}
      className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 active:scale-95 ${ringColor} ${className}`}
    >
      {/* 铃身 */}
      <svg
        viewBox="0 0 24 24"
        className={`w-4 h-4 ${iconColor} transition-colors`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </svg>
      {/* 播放中的扩散波 */}
      {enabled && (
        <>
          <span
            className={`absolute inset-0 rounded-full ${
              immersive ? 'border border-white/50' : 'border border-amber-400/70'
            } animate-[ping_2.4s_ease-out_infinite]`}
            aria-hidden
          />
          <span
            className={`absolute -inset-1 rounded-full ${
              immersive ? 'border border-white/30' : 'border border-amber-300/50'
            } animate-[ping_2.4s_ease-out_infinite_0.8s]`}
            aria-hidden
          />
        </>
      )}
    </button>
  );
}
