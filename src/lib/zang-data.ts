// ============================================================
// zang-data —— 藏经阁服务端数据获取
// 用于 generateStaticParams 与 SSG 数据预拉
// 客户端兜底逻辑保留在 [slug]/page.tsx（'use client' 兜底路径）
// ============================================================

import { mockDaoDeJing, type MockArticle } from '@/app/zang/library/mock-dao-de-jing';

export type Article = MockArticle;

// 单文章兜底（与 [slug]/page.tsx 保持一致）
// content 留空：UI 走"经典原文加载中"，不暴露技术提示
const singleMock: Record<string, Article> = {
  'liu-zu-tan-jing': { id: 'lztj1', slug: 'liu-zu-tan-jing', title: '六祖坛经', content: '', source: '慧能', category: 'classics', created_at: '2024-02-01T00:00:00Z' },
  'jin-gang-jing':   { id: 'jgj1',  slug: 'jin-gang-jing',   title: '金刚经',   content: '', source: '释迦牟尼', category: 'classics', created_at: '2024-03-01T00:00:00Z' },
  'yi-jing-overview':{ id: 'yj1',   slug: 'yi-jing-overview',title: '易经·总述',content: '', source: '周文王', category: 'classics', created_at: '2024-04-01T00:00:00Z' },
};

/** 单文章查找（服务端版） */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  // 1. 尝试 Supabase（如果配置）
  try {
    const { supabase, isSupabaseConfigured } = await import('@/lib/supabase');
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!error && data) return data as Article;
    }
  } catch {
    /* Supabase 不可用时静默降级 */
  }

  // 2. 兜底：singleMock → 道德经 81 章
  return singleMock[slug] ?? mockDaoDeJing.find((a) => a.slug === slug) ?? null;
}

/** 所有应预生成的经典篇章（用于 generateStaticParams） */
export interface ClassicPageRef {
  category: string;
  slug: string;
}

/** 经典清单：道德经 81 章 / 金刚经 / 心经 / 六祖坛经 / 易经总述 */
export const CLASSIC_PAGES: ClassicPageRef[] = [
  ...mockDaoDeJing.map((a) => ({ category: 'laozi', slug: a.slug })),
  { category: 'shijiamouni', slug: 'jin-gang-jing' },
  { category: 'shijiamouni', slug: 'xin-jing' },
  { category: 'huineng', slug: 'liu-zu-tan-jing' },
  { category: 'zhouwenwang', slug: 'yi-jing-overview' },
];
