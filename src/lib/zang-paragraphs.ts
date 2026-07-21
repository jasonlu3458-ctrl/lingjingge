// ============================================================
// zang-paragraphs —— 藏经段落拆分工具
// 输入：HTML 字符串（来自 articles.content）
// 输出：纯文本段落数组（按 </p> 或 \n\n 拆分）
// ============================================================

/** 把 HTML 标签全去掉，只留纯文本 + 段落分隔 */
function stripHtml(html: string): string {
  if (!html) return '';
  // 段落闭合处先加换行
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n');
  // 去除所有 HTML 标签
  const text = withBreaks.replace(/<[^>]+>/g, '');
  // 实体解码（基础）
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** 拆分为段落数组（每段 trim 后非空） */
export function splitArticleToParagraphs(html: string): string[] {
  const text = stripHtml(html);
  // 优先按 \n\n 切；没有时按 \n 切
  const parts = text
    .split(/\n{2,}|\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0);
  return parts;
}

/** 截取前 30% 字符作为 free 预览（按段落边界对齐） */
export function splitTranslationForPaywall(translation: string): { free: string; premium: string } {
  if (!translation) return { free: '', premium: '' };
  const cleaned = translation.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 80) return { free: cleaned, premium: '' };
  const targetLen = Math.max(80, Math.floor(cleaned.length * 0.3));
  // 在目标长度附近找最近的标点/空格作为边界
  const slice = cleaned.slice(0, targetLen);
  const lastBoundary = Math.max(
    slice.lastIndexOf('。'),
    slice.lastIndexOf('，'),
    slice.lastIndexOf(' '),
    slice.lastIndexOf('；'),
  );
  const cutAt = lastBoundary > 40 ? lastBoundary + 1 : targetLen;
  return {
    free: cleaned.slice(0, cutAt),
    premium: cleaned.slice(cutAt),
  };
}
