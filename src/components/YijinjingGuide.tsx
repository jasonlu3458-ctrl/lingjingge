// ============================================================
// YijinjingGuide —— 易筋经动功引导（平圆 / 立圆）
// 主视觉：发光圆环 + 旋转光点（2s 一圈）
// 背后：半透明人骨架（6 部位姿态切换）
// 节拍：6 部位 × 8 拍 × 2s = 96s
// ============================================================

'use client';

import { useEffect, useState, useRef, type ReactNode, type MouseEvent } from 'react';
import {
  MOVEMENT_PARTS,
  BEATS_PER_PART,
  BEAT_INTERVAL_MS,
  type BodyType,
} from '@/lib/body-rules';

export interface YijinjingGuideProps {
  type: BodyType; // 'pingyuan' | 'liyuan'
  onComplete: (elapsedSec: number, completedParts: number) => void;
  onExit: (e?: MouseEvent<HTMLButtonElement>) => void;
}

/** 6 部位对应的骨架姿态（transform 微调） */
interface PoseTransform {
  /** 头部位移（x, y） */
  head: { x: number; y: number };
  /** 左臂角度（度） */
  leftArm: number;
  /** 右臂角度 */
  rightArm: number;
  /** 双臂张度（0=垂，1=平举，2=上举） */
  armSpread: number;
  /** 身体 x 偏移（用于转圆） */
  bodyX: number;
  /** 腿部张度（0=并，1=微张） */
  legSpread: number;
}

const POSES: PoseTransform[] = [
  // 0: 头部微转 —— 头略右移
  { head: { x: 8, y: 0 }, leftArm: 0, rightArm: 0, armSpread: 0.2, bodyX: 0, legSpread: 0 },
  // 1: 左臂平圆 —— 左臂平举
  { head: { x: 0, y: 0 }, leftArm: -90, rightArm: 0, armSpread: 1, bodyX: 0, legSpread: 0 },
  // 2: 右臂平圆 —— 右臂平举
  { head: { x: 0, y: 0 }, leftArm: 0, rightArm: 90, armSpread: 1, bodyX: 0, legSpread: 0 },
  // 3: 双手抱圆 —— 双臂环抱
  { head: { x: 0, y: -2 }, leftArm: -45, rightArm: 45, armSpread: 0.6, bodyX: 0, legSpread: 0 },
  // 4: 身体转圆 —— 身体 x 偏
  { head: { x: 0, y: 0 }, leftArm: 0, rightArm: 0, armSpread: 0.4, bodyX: 10, legSpread: 0.2 },
  // 5: 腿部缓圆 —— 腿微张
  { head: { x: 0, y: 0 }, leftArm: 0, rightArm: 0, armSpread: 0.2, bodyX: 0, legSpread: 0.6 },
];

/** 人骨架 SVG（受 pose 控制各部位 transform） */
function Skeleton({ pose }: { pose: PoseTransform }): ReactNode {
  const headStyle = { transform: `translate(${pose.head.x}px, ${pose.head.y}px)` };
  const leftArmStyle = { transformOrigin: '100px 130px', transform: `rotate(${pose.leftArm}deg)` };
  const rightArmStyle = { transformOrigin: '100px 130px', transform: `rotate(${pose.rightArm}deg)` };
  const bodyStyle = { transform: `translateX(${pose.bodyX}px)` };
  const leftLegStyle = { transformOrigin: '100px 240px', transform: `translateX(${-pose.legSpread * 18}px)` };
  const rightLegStyle = { transformOrigin: '100px 240px', transform: `translateX(${pose.legSpread * 18}px)` };

  return (
    <g style={{ transition: 'transform 800ms ease-in-out' }}>
      {/* 头 */}
      <g style={headStyle}>
        <circle cx="100" cy="60" r="18" fill="none" stroke="#e5e5e5" strokeWidth="1.2" />
      </g>
      {/* 脊柱 */}
      <g style={bodyStyle}>
        <line x1="100" y1="78" x2="100" y2="240" stroke="#e5e5e5" strokeWidth="1.2" />
      </g>
      {/* 左臂 */}
      <g style={leftArmStyle}>
        <line x1="100" y1="130" x2="60" y2={130 + pose.armSpread * 50} stroke="#e5e5e5" strokeWidth="1.2" />
        <line x1="60" y1={130 + pose.armSpread * 50} x2="40" y2={130 + pose.armSpread * 80} stroke="#e5e5e5" strokeWidth="1.2" />
      </g>
      {/* 右臂 */}
      <g style={rightArmStyle}>
        <line x1="100" y1="130" x2="140" y2={130 + pose.armSpread * 50} stroke="#e5e5e5" strokeWidth="1.2" />
        <line x1="140" y1={130 + pose.armSpread * 50} x2="160" y2={130 + pose.armSpread * 80} stroke="#e5e5e5" strokeWidth="1.2" />
      </g>
      {/* 左腿 */}
      <g style={leftLegStyle}>
        <line x1="100" y1="240" x2="85" y2="330" stroke="#e5e5e5" strokeWidth="1.2" />
      </g>
      {/* 右腿 */}
      <g style={rightLegStyle}>
        <line x1="100" y1="240" x2="115" y2="330" stroke="#e5e5e5" strokeWidth="1.2" />
      </g>
    </g>
  );
}

export default function YijinjingGuide({ type, onComplete, onExit }: YijinjingGuideProps): ReactNode {
  const [partIndex, setPartIndex] = useState<number>(0);
  const [beat, setBeat] = useState<number>(0); // 0..7
  const completedRef = useRef<boolean>(false);

  // 节拍器：每 2s 推进
  useEffect(() => {
    const id = window.setInterval(() => {
      setBeat((prevBeat) => {
        const nextBeat = prevBeat + 1;
        if (nextBeat >= BEATS_PER_PART) {
          setPartIndex((prevPart) => {
            const nextPart = prevPart + 1;
            if (nextPart >= MOVEMENT_PARTS.length) {
              // 全部完成
              if (!completedRef.current) {
                completedRef.current = true;
                const totalSec = MOVEMENT_PARTS.length * BEATS_PER_PART * (BEAT_INTERVAL_MS / 1000);
                window.setTimeout(() => onComplete(totalSec, MOVEMENT_PARTS.length), 0);
              }
              return prevPart;
            }
            return nextPart;
          });
          return 0;
        }
        return nextBeat;
      });
    }, BEAT_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [onComplete]);

  const title = type === 'pingyuan' ? '易筋经 · 平圆' : '易筋经 · 立圆';
  const pose = POSES[Math.min(partIndex, POSES.length - 1)];
  const isLiyuan = type === 'liyuan';

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
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif", color: '#c8b496' }}
        >
          {title}
        </h2>
        <p className="mt-2 text-xs text-gray-500 tracking-widest">
          {MOVEMENT_PARTS[Math.min(partIndex, MOVEMENT_PARTS.length - 1)]?.name ?? ''} · 共 {MOVEMENT_PARTS.length} 式
        </p>
      </div>

      {/* 中心：光轨 + 骨架 */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 560, height: 560 }}
      >
        {/* 发光圆环（半径 250px，1px 边） */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            border: '1px solid rgba(200, 180, 150, 0.5)',
            boxShadow: '0 0 24px 0 rgba(200, 180, 150, 0.15), inset 0 0 24px 0 rgba(200, 180, 150, 0.08)',
          }}
        />

        {/* 旋转光点（2s 一圈）—— 立在圆环顶端 */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 30, // 圆环顶端 y 偏移 (560-500)/2
            left: 280, // 圆环中心 x = 280
            width: 14,
            height: 14,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(255,240,200,1) 0%, rgba(255,200,120,0.4) 50%, rgba(0,0,0,0) 80%)',
            boxShadow: '0 0 20px 6px rgba(255,200,120,0.6)',
            animation: `yjjSpin 2s linear infinite`,
            transformOrigin: `50% ${280 - 30}px`, // 绕中心旋转
          }}
        />

        {/* 骨架 SVG（半透明） */}
        <svg
          viewBox="0 0 200 360"
          className="absolute"
          style={{ width: 280, height: 504, opacity: 0.35 }}
        >
          <Skeleton pose={pose} />
        </svg>
      </div>

      {/* 右下角节拍计数器 */}
      <div className="absolute bottom-10 right-10 z-10 text-right">
        <div
          className="text-6xl font-light tracking-widest tabular-nums"
          style={{ color: '#c8b496' }}
        >
          {Math.min(beat + 1, BEATS_PER_PART)}/{BEATS_PER_PART}
        </div>
        <p className="mt-2 text-xs text-gray-500 tracking-widest">
          第 {Math.min(partIndex + 1, MOVEMENT_PARTS.length)} 式 · {MOVEMENT_PARTS[Math.min(partIndex, MOVEMENT_PARTS.length - 1)]?.name ?? ''}
        </p>
        <p className="mt-1 text-[10px] text-gray-600">
          {isLiyuan ? '立圆 · 腿法' : '平圆 · 手部'} · 2 秒/拍
        </p>
      </div>

      {/* 旋转动画 keyframes */}
      <style>{`
        @keyframes yjjSpin {
          0%   { transform: translate(-50%, -50%) rotate(0deg) translateY(-250px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateY(-250px) rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}
