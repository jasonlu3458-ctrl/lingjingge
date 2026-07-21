// ============================================================
// ReadingModeBar —— 阅读模式控制栏
// 三模式：逐句对照（contrast） / 古卷模式（scroll） / 暗夜模式（dark）
// ============================================================

'use client';

import type { ReactNode } from 'react';

export type ReadingMode = 'contrast' | 'scroll' | 'dark';

export interface ReadingModeBarProps {
  value: ReadingMode;
  onChange: (m: ReadingMode) => void;
}

const MODES: Array<{ key: ReadingMode; icon: string; label: string; hint: string }> = [
  { key: 'contrast', icon: '📖', label: '逐句对照', hint: '原文 + 译文左右分栏' },
  { key: 'scroll',   icon: '🪶', label: '古卷模式', hint: '竖排 · 宣纸色' },
  { key: 'dark',     icon: '🌙', label: '暗夜模式', hint: '深色 · 护眼' },
];

export default function ReadingModeBar({ value, onChange }: ReadingModeBarProps): ReactNode {
  return (
    <div
      className="flex flex-wrap items-center gap-2 mb-6 border-b pb-4"
      role="tablist"
      aria-label="阅读模式"
      style={{ borderColor: 'currentColor', opacity: 0.9 }}
    >
      <span className="text-xs opacity-60 mr-2 tracking-widest">阅读模式</span>
      {MODES.map((m) => {
        const active = value === m.key;
        return (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.key)}
            title={m.hint}
            className={`px-4 py-1.5 text-sm rounded-full transition-all flex items-center gap-1.5 ${
              active
                ? 'bg-[#b88a4a] text-white shadow-md scale-[1.02]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-[1.02]'
            }`}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
