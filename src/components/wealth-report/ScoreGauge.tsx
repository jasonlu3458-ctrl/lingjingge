// ============================================================
// ScoreGauge —— 通用评分仪表盘（圆形 SVG 进度环）
// 用于：事业智富 / 生命密码 等所有报告模块
// ============================================================

'use client';

import type { ReactNode } from 'react';

export interface ScoreGaugeProps {
  /** 0-100 整数 */
  score: number;
  /** 评分下方的解释文字（颜色由 score 自动判断） */
  label: string;
  /** 主题色：传入后作为描边/文字色；不传则按 score 自动选 4 档 */
  themeColor?: string;
  /** 容器 className 拓展 */
  className?: string;
}

function colorOf(score: number, theme?: string): string {
  if (theme) return theme;
  if (score >= 85) return '#16a34a';
  if (score >= 70) return '#ca8a04';
  if (score >= 50) return '#d97706';
  return '#b91c1c';
}

export default function ScoreGauge({ score, label, themeColor, className = '' }: ScoreGaugeProps): ReactNode {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const color = colorOf(score, themeColor);
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* 移动端 100×100，桌面 148×148。viewBox 固定 148 让内部文字 stroke 等比例缩放 */}
      <svg
        viewBox="0 0 148 148"
        className="w-[100px] h-[100px] md:w-[148px] md:h-[148px] drop-shadow-sm"
        aria-label={`评分 ${score} / 100`}
      >
        <circle cx="74" cy="74" r={radius} fill="none" stroke="#f5e6cf" strokeWidth="12" />
        <circle
          cx="74" cy="74" r={radius}
          fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          transform="rotate(-90 74 74)"
        />
        <text x="74" y="70" textAnchor="middle" fontSize="32" fontWeight="700" fill={color}>
          {score}
        </text>
        <text x="74" y="92" textAnchor="middle" fontSize="11" fill="#7a5a3a">
          / 100
        </text>
      </svg>
      <div className="mt-1 text-xs font-semibold" style={{ color, fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}>
        {label}
      </div>
    </div>
  );
}
