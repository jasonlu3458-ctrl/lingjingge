/**
 * 道德经 81 章兜底数据
 *
 * 独立文件以便 [category]/page.tsx 与 [category]/[slug]/page.tsx
 * 共同引用（Next.js 14 不允许 page.tsx 导出任意 const）。
 *
 * 数据形态与 articles 表一致；Supabase 不可用时供前端兜底渲染。
 */

export interface MockArticle {
  id: string;
  slug: string;
  title: string;
  content: string;
  source: string | null;
  category: string | null;
  translation?: string | null;
  translated_at?: string | null;
  annotation?: string | null;
  author_note?: string | null;
  created_at: string;
}

const CHINESE_NUM = [
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十',
  '三十一', '三十二', '三十三', '三十四', '三十五', '三十六', '三十七', '三十八', '三十九', '四十',
  '四十一', '四十二', '四十三', '四十四', '四十五', '四十六', '四十七', '四十八', '四十九', '五十',
  '五十一', '五十二', '五十三', '五十四', '五十五', '五十六', '五十七', '五十八', '五十九', '六十',
  '六十一', '六十二', '六十三', '六十四', '六十五', '六十六', '六十七', '六十八', '六十九', '七十',
  '七十一', '七十二', '七十三', '七十四', '七十五', '七十六', '七十七', '七十八', '七十九', '八十',
  '八十一',
];

export const mockDaoDeJing: MockArticle[] = Array.from({ length: 81 }, (_, i) => ({
  id: `dj${i + 1}`,
  slug: `dao-de-jing-chapter-${i + 1}`,
  title: `道德经·第${CHINESE_NUM[i]}章`,
  content: `道德经第 ${i + 1} 章内容（兜底数据）。请连接 Supabase 以查看完整原文。`,
  source: '老子',
  category: 'classics',
  created_at: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
}));
