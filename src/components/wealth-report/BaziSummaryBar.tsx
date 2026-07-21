// ============================================================
// BaziSummaryBar —— 通用八字摘要栏（横向 6 chip）
// 复用：事业智富 / 生命密码 等所有报告模块
// ============================================================

'use client';

import type { ReactNode } from 'react';

export interface BaziSummaryItem {
  label: string;
  value: string;
  /** chip 内文字颜色 */
  tone?: string;
}

export interface BaziSummaryBarProps {
  items: BaziSummaryItem[];
  /** 边框色，默认 amber-200 */
  borderClass?: string;
  /** 背景色 */
  bgClass?: string;
}

export default function BaziSummaryBar({
  items,
  borderClass = 'border-amber-200',
  bgClass = 'bg-white/80',
}: BaziSummaryBarProps): ReactNode {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {items.map((it, i) => (
        <div
          key={i}
          className={`rounded-lg border ${borderClass} ${bgClass} px-2 py-2 text-center`}
        >
          <div className="text-[10px] text-gray-500" style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}>
            {it.label}
          </div>
          <div
            className="text-sm font-bold mt-0.5"
            style={{ color: it.tone || '#7a5a3a', fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}
