// ============================================================
// LockedCard —— 通用锁定卡片（付费/会员 解锁后查看完整内容）
// 复用：事业智富 / 生命密码 等所有报告模块
// ============================================================

'use client';

import type { ReactNode } from 'react';

export interface LockedCardMeta {
  icon: string;
  /** 1 句预览（让用户看到"解锁后"能看什么） */
  preview: string;
  /** 主题色 */
  tone: string;
}

export interface LockedCardProps {
  index: number;
  meta: LockedCardMeta;
  title: string;
  /** 锁定 chip 文案，默认"付费 {n}" */
  chipPrefix?: string;
}

export default function LockedCard({ index, meta, title, chipPrefix = '付费' }: LockedCardProps): ReactNode {
  return (
    <div className="relative rounded-xl border-2 border-dashed border-amber-300 bg-white/40 p-4 overflow-hidden">
      {/* 斜线纹理背景 */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none select-none"
        style={{
          background: `repeating-linear-gradient(45deg, transparent, transparent 8px, ${meta.tone}10 8px, ${meta.tone}10 16px)`,
        }}
      />
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-white/80">
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: meta.tone, color: 'white', fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
              >
                {chipPrefix} {index + 1}
              </span>
              <h3
                className="text-base font-bold text-gray-700"
                style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
              >
                {title}
              </h3>
            </div>
            <p
              className="mt-2 text-xs text-gray-500 leading-relaxed"
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
            >
              {meta.preview}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-700">
              <span>🔒</span>
              <span style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}>解锁后查看完整内容</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
