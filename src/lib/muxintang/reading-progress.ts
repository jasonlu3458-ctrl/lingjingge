/**
 * 牧心堂 · 行者故事 · 阅读进度记忆
 *
 * 用 localStorage 记录用户最近一次阅读的章节 + 段落位置。
 * 下次进入 /library 时，LibraryTabs 顶部会用金字提示「读到《第X卷·钟》第 3 段，继续阅读」。
 *
 * 存储格式：JSON.stringify(LastRead)
 * 存储键：muxintang:last-read（项目内统一前缀）
 *
 * 注意：
 *   - 仅在浏览器端使用，SSR 时所有方法返回 null / 静默
 *   - 写入失败（隐私模式 / 配额满）静默吞掉，不影响阅读
 *   - 段落索引从 0 开始，但展示给用户时 +1（"第 3 段"对应 paraIdx=2）
 */

export interface LastRead {
  slug: string;
  title: string;
  chapterIndex: number | null;
  storyType: 'serial' | 'short';
  paragraphIdx: number;
  paragraphCount: number;
  updatedAt: string;
}

const KEY = 'muxintang:last-read';

export function saveProgress(p: LastRead): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* 隐私模式 / 配额满 → 静默 */
  }
}

export function getProgress(): LastRead | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as LastRead;
    if (
      typeof p?.slug !== 'string' ||
      typeof p?.title !== 'string' ||
      typeof p?.paragraphIdx !== 'number'
    ) {
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function clearProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 静默 */
  }
}

export function formatLastReadTitle(p: LastRead): string {
  if (p.storyType === 'short' || p.chapterIndex == null) {
    return `短篇·${p.title}`;
  }
  return `第${p.chapterIndex}卷·${p.title}`;
}

export function formatParagraphLabel(p: LastRead): string {
  return `第 ${p.paragraphIdx + 1} 段`;
}