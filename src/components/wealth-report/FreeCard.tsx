// ============================================================
// FreeCard —— 通用免费报告卡
// 复用：事业智富 / 生命密码 等所有报告模块
// ============================================================

'use client';

import type { ReactNode } from 'react';

export interface FreeCardMeta {
  /** 卡片左侧图标 emoji */
  icon: string;
  /** 副标题 · 浅灰小字 */
  subtitle: string;
  /** 主题色（数字 chip、标题、icon 背景） */
  tone: string;
}

export interface FreeCardProps {
  /** 0-based 序号，会显示为数字 chip */
  index: number;
  meta: FreeCardMeta;
  title: string;
  content: string;
  /** 引用源（可选，显示在底部） */
  source?: string;
}

export default function FreeCard({ index, meta, title, content, source }: FreeCardProps): ReactNode {
  return (
    <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: `${meta.tone}20`, color: meta.tone }}
        >
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: meta.tone, color: 'white', fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
            >
              {index + 1}
            </span>
            <h3
              className="text-base font-bold"
              style={{ color: meta.tone, fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
            >
              {title}
            </h3>
            <span className="text-[10px] text-gray-400">· {meta.subtitle}</span>
          </div>
          <p
            className="mt-2 text-sm text-gray-700 leading-relaxed"
            style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
          >
            {content}
          </p>
          {source && (
            <p className="mt-2 text-[10px] text-gray-400 italic">— {source}</p>
          )}
        </div>
      </div>
    </div>
  );
}
