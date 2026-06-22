import type { ReactNode } from 'react';

/**
 * 轻量内联 Markdown 渲染器
 * ------------------------------------------------------------
 * 为什么不用 react-markdown？
 *   react-markdown@10 是 ESM-only，Next.js 14 + RSC 下做静态/动态 import
 *   都会在浏览器侧触发 "Cannot read properties of undefined (reading 'call')"
 *   的 hydration 错误（mountLazyComponent → readChunk 失败）。
 *
 * Dify / 本地模板返回的文本结构很有限，** / ## / 列表 / 段落就够用。
 * 后续若需要图片、表格、代码块再升级到真正的 MD 解析器。
 *
 * 支持语法：
 *   **加粗**        → <strong>
 *   # / ## / ###    → h3 / h4 / h5（自带行距、字号）
 *   -  / *          → <ul><li>
 *   1. 2. 3.        → <ol><li>
 *   普通段落        → <p>
 */

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={`b${key++}`}>{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export interface MiniMarkdownProps {
  text: string;
  className?: string;
}

export default function MiniMarkdown({ text, className }: MiniMarkdownProps) {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') { i++; continue; }

    // 标题
    const h = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (h) {
      const level = h[1].length;
      const content = h[2];
      const cls =
        level === 1
          ? 'text-lg font-bold mt-3'
          : level === 2
            ? 'text-base font-bold mt-2'
            : 'text-sm font-bold mt-2';
      const Tag = (`h${level + 2}`) as 'h3' | 'h4' | 'h5';
      blocks.push(<Tag key={key++} className={cls}>{renderInline(content)}</Tag>);
      i++;
      continue;
    }

    // 无序列表
    if (/^[-*]\s+/.test(trimmed)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(
          <li key={items.length}>
            {renderInline(lines[i].trim().replace(/^[-*]\s+/, ''))}
          </li>
        );
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-5 space-y-1">
          {items}
        </ul>
      );
      continue;
    }

    // 有序列表
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(
          <li key={items.length}>
            {renderInline(lines[i].trim().replace(/^\d+\.\s+/, ''))}
          </li>
        );
        i++;
      }
      blocks.push(
        <ol key={key++} className="list-decimal pl-5 space-y-1">
          {items}
        </ol>
      );
      continue;
    }

    // 普通段落：合并连续非空行
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,3})\s+/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="leading-relaxed">
        {renderInline(para.join(' '))}
      </p>
    );
  }
  return <div className={className}>{blocks}</div>;
}
