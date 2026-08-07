'use client';

/**
 * XuanReportCard —— 灵境阁通用报告卡
 *
 * 适用：form-first 工具提交后展示的报告（取名 / 解梦 / 易理 / 八字 / 配对等）
 *
 * 特性：
 *  - 标题 + 副标题 + 工具 icon
 *  - 多段内容（sections），可标记「重点」高亮
 *  - 顶部右上「分享海报」按钮（TODO: 接入 ZenPoster）
 *  - 底部「咨询阿阇梨」按钮：点击展开对话入口（callback 模式由父组件提供）
 *  - 顶部"返回修改"按钮可让用户回到表单
 */

import { useState } from 'react';

export interface ReportSection {
  /** 段标题 */
  title: string;
  /** 段内容（支持多行） */
  content: string;
  /** 段类型：'highlight' 给重点段加金边高亮，'plain' 默认 */
  variant?: 'highlight' | 'plain';
  /** 段内 emoji 前缀（可选） */
  icon?: string;
}

export interface XuanReportCardProps {
  /** 报告标题（如"AI 取名报告"） */
  title: string;
  /** 副标题 */
  subtitle?: string;
  /** 工具 icon */
  icon: string;
  /** 主题色（accent） */
  themeColor: string;
  /** 报告生成时间（可选） */
  generatedAt?: string;
  /** 报告段落（顺序展示） */
  sections: ReportSection[];
  /** 「咨询阿阇梨」按钮回调：父组件展开对话 */
  onConsultAcharya?: () => void;
  /** 「返回修改」按钮回调：父组件回到表单 */
  onBack?: () => void;
  /** 「分享海报」按钮回调（可选） */
  onShare?: () => void;
  /** 「再测一次」按钮回调（可选） */
  onRetry?: () => void;
}

export default function XuanReportCard({
  title,
  subtitle,
  icon,
  themeColor,
  generatedAt,
  sections,
  onConsultAcharya,
  onBack,
  onShare,
  onRetry,
}: XuanReportCardProps) {
  const [consultExpanded, setConsultExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl border border-amber-200/30 shadow-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
      }}
    >
      {/* 顶部条 */}
      <div
        className="px-6 py-4 flex items-center justify-between border-b"
        style={{
          background: `linear-gradient(90deg, ${themeColor}20 0%, transparent 100%)`,
          borderColor: `${themeColor}30`,
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-2xl"
            style={{
              background: `${themeColor}20`,
              border: `1px solid ${themeColor}50`,
            }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <h2
              className="text-lg md:text-xl font-semibold text-amber-50 truncate"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-amber-200/60 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onShare && (
            <button
              onClick={onShare}
              className="px-3 py-1.5 text-xs rounded-md border border-amber-200/40 text-amber-100 hover:bg-amber-500/10 transition-colors"
              title="生成分享海报"
            >
              📤 分享
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 text-xs rounded-md border border-amber-200/40 text-amber-100 hover:bg-amber-500/10 transition-colors"
            >
              ✏️ 修改
            </button>
          )}
        </div>
      </div>

      {/* 报告正文 */}
      <div className="px-6 py-6 md:px-8 md:py-8 space-y-6">
        {generatedAt && (
          <p className="text-[11px] text-amber-200/40 tracking-wider">
            生成时间 · {generatedAt}
          </p>
        )}

        {sections.map((s, i) => {
          const isHighlight = s.variant === 'highlight';
          return (
            <div
              key={i}
              className={`rounded-lg p-5 ${
                isHighlight
                  ? 'border-2 shadow-lg'
                  : 'border border-amber-900/30'
              }`}
              style={
                isHighlight
                  ? {
                      background: `linear-gradient(135deg, ${themeColor}15 0%, ${themeColor}05 100%)`,
                      borderColor: `${themeColor}80`,
                      boxShadow: `0 0 24px ${themeColor}20`,
                    }
                  : {
                      background: 'rgba(255,255,255,0.02)',
                    }
              }
            >
              <h3
                className="text-base md:text-lg font-semibold text-amber-50 mb-3 flex items-center gap-2"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {s.icon && <span className="text-xl">{s.icon}</span>}
                <span>{s.title}</span>
              </h3>
              <div
                className="text-sm md:text-base text-amber-100/90 leading-relaxed whitespace-pre-wrap"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {s.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部操作区 */}
      <div
        className="px-6 py-5 border-t"
        style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}
      >
        {!consultExpanded ? (
          <div className="flex flex-col sm:flex-row gap-3">
            {onConsultAcharya && (
              <button
                onClick={() => {
                  setConsultExpanded(true);
                  onConsultAcharya();
                }}
                className="flex-1 py-3 px-6 rounded-lg font-semibold text-amber-50 border-2 transition-all duration-200 hover:bg-amber-500/10"
                style={{
                  borderColor: themeColor,
                  background: `linear-gradient(135deg, ${themeColor}20 0%, ${themeColor}10 100%)`,
                  fontFamily: "'Ma Shan Zheng', cursive, serif",
                }}
              >
                💬 咨询阿阇梨（深度解读）
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="sm:w-40 py-3 px-6 rounded-lg font-medium text-amber-100 border border-amber-200/30 hover:bg-amber-500/5 transition-colors"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                🔄 再测一次
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-lg p-4 border border-amber-200/30 bg-amber-500/5">
            <p className="text-sm text-amber-100/80">
              💬 对话入口已展开——在下方输入你的问题，阿阇梨会基于本份报告为你详细解读。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
