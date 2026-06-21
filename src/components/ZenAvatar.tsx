'use client';

import type { CSSProperties } from 'react';

/**
 * ZenAvatar —— 灵境阁统一 AI 视觉形象
 *
 * 极简打坐者背影线条（轮廓式）
 *  - 半透明淡金色（amber-700/20）
 *  - 仅 6 条轮廓线：头、肩、双臂盘坐、膝
 *  - 不区分 difyType / 不传参切换
 *  - 默认 32×32，size 传任意 px
 *
 * 设计哲学：
 *  - "背影" = 不强调人格个性，避免给用户 AI 是某具体"人"的错觉
 *  - 极淡墨色 = 让对话内容成为视觉焦点
 *  - SVG 而非 emoji = 跨平台一致，可继承父级 text color
 */
export interface ZenAvatarProps {
  /** 边长（px），默认 32 */
  size?: number;
  /** 透明度，默认 0.2 */
  opacity?: number;
  /** 自定义 className */
  className?: string;
  /** 自定义 style（会覆盖默认色/透明） */
  style?: CSSProperties;
  /** 提示文字 */
  title?: string;
}

export default function ZenAvatar({
  size = 32,
  opacity = 0.2,
  className = '',
  style,
  title = '灵境阁 · AI',
}: ZenAvatarProps) {
  // viewBox 24，stroke 用 currentColor 继承父级色
  // 默认 amber-700（淡金色），父级若无 text-amber-700 则 fallback gray-500
  const baseStyle: CSSProperties = {
    width: size,
    height: size,
    opacity,
    color: '#b88a4a', // amber-700
    flexShrink: 0,
    display: 'inline-block',
    verticalAlign: 'middle',
    ...style,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={baseStyle}
      className={className}
      role="img"
      aria-label={title}
    >
      {/* 头 */}
      <circle cx="12" cy="6" r="2" />
      {/* 肩 + 颈 */}
      <path d="M12 8.2 L12 10.2" />
      <path d="M8 11.5 Q12 9.5 16 11.5" />
      {/* 双臂盘坐（左肩→左膝，右肩→右膝） */}
      <path d="M8 11.5 Q5 14 6 17" />
      <path d="M16 11.5 Q19 14 18 17" />
      {/* 双膝（盘坐底） */}
      <path d="M5.5 17.5 Q12 19 18.5 17.5" />
      {/* 双膝到肩的闭合线（外轮廓） */}
      <path d="M5.5 17.5 L8 11.5" />
      <path d="M18.5 17.5 L16 11.5" />
    </svg>
  );
}
