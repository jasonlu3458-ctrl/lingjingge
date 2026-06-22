'use client';

import { useCallback, useState } from 'react';
import { useTTS } from '@/hooks/useTTS';

interface Props {
  /** 报告容器 DOM id（如 "wealth-report"），按钮会从该元素内提取文本 */
  targetId: string;
  /** 报告标题（仅用作 aria-label） */
  title?: string;
  /** 按钮色调 */
  tone?: 'amber' | 'emerald' | 'sky' | 'rose' | 'violet' | 'teal' | 'indigo';
  /** 提取后是否追加报告标题前缀（增强 TTS 自然度） */
  prefix?: string;
  className?: string;
}

const TONE_STYLES: Record<NonNullable<Props['tone']>, string> = {
  amber:   'from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800',
  emerald: 'from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800',
  sky:     'from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800',
  rose:    'from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800',
  violet:  'from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800',
  teal:    'from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800',
  indigo:  'from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800',
};

/**
 * 从 DOM 节点提取"朗读友好"文本：
 *  - 跳过 <script>/<style> 和隐藏元素
 *  - 每个 block 元素之间插入句号（保证 TTS 停顿）
 *  - 压缩多余空白
 */
function extractSpeakableText(root: HTMLElement): string {
  const blockTags = new Set([
    'P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BR', 'TR', 'SECTION', 'ARTICLE',
  ]);
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);

  const parts: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (SKIP.has(el.tagName)) return;
      const cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      for (const child of Array.from(el.childNodes)) walk(child);
      if (blockTags.has(el.tagName)) parts.push('。');
    } else if (node.nodeType === Node.TEXT_NODE) {
      const txt = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (txt) parts.push(txt);
    }
  };
  walk(root);
  return parts
    .join('')
    .replace(/[。\.！\!？\?；;]+。/g, '。')
    .replace(/[。\.！\!？\?；;]{1,2}\s*。/g, '。')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * ReportTTSButton —— 报告页通用"朗读"按钮
 *
 * 用法（与 ExportPDFButton 并列）：
 *   <ReportTTSButton targetId="wealth-report" title="事业智富报告" tone="amber" />
 */
export default function ReportTTSButton({
  targetId,
  title = '报告',
  tone = 'amber',
  prefix,
  className = '',
}: Props) {
  const { speak, stop, isSpeaking, isLoading, error } = useTTS();
  const [extErr, setExtErr] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    if (isSpeaking) {
      stop();
      return;
    }
    setExtErr(null);
    const root = typeof document !== 'undefined' ? document.getElementById(targetId) : null;
    if (!root) {
      setExtErr(`找不到 #${targetId}`);
      return;
    }
    let txt = extractSpeakableText(root);
    if (prefix) txt = `${prefix}\n\n${txt}`;
    if (!txt || txt.length < 4) {
      setExtErr('报告未加载完成或无内容');
      return;
    }
    if (txt.length > 1500) txt = txt.slice(0, 1500) + '。';
    speak(txt).catch(() => undefined);
  }, [isSpeaking, stop, targetId, prefix, speak]);

  const label = isLoading
    ? '🎙️ 合成中…'
    : isSpeaking
      ? '⏸ 停止朗读'
      : '🔊 朗读报告';

  const errMsg = error || extErr;
  const toneClass = TONE_STYLES[tone] || TONE_STYLES.amber;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={`${isSpeaking ? '停止朗读' : '朗读'}${title}`}
      title={errMsg ? `TTS：${errMsg}` : label}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold shadow-md transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-br ${toneClass} ${className}`}
    >
      {label}
      {isSpeaking && (
        <span className="ml-1 flex gap-0.5 items-end" aria-hidden>
          <span className="w-0.5 h-2 bg-white/90 rounded animate-[pulse_0.9s_ease-in-out_infinite]" />
          <span className="w-0.5 h-3 bg-white/90 rounded animate-[pulse_0.9s_ease-in-out_infinite_0.15s]" />
          <span className="w-0.5 h-2 bg-white/90 rounded animate-[pulse_0.9s_ease-in-out_infinite_0.3s]" />
        </span>
      )}
    </button>
  );
}
