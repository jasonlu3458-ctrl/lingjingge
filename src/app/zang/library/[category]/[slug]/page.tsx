// ============================================================
// /zang/library/[category]/[slug] —— 藏经篇章详情
// Server Component：负责 SSG 数据预拉 + generateStaticParams + metadata
// 客户端交互（模式切换 / AI 参详 / 付费墙）下放给 ArticleDetailClient
// ============================================================

import Link from 'next/link';
import type { Metadata } from 'next';
import { getArticleBySlug, CLASSIC_PAGES, type Article } from '@/lib/zang-data';
import ArticleDetailClient from './ArticleDetailClient';

interface PageProps {
  params: { category: string; slug: string };
}

/** SEO 静态化：经典 81 章 + 4 部单篇，预生成 HTML 提升收录 */
export function generateStaticParams(): Array<{ category: string; slug: string }> {
  return CLASSIC_PAGES.map((p) => ({ category: p.category, slug: p.slug }));
}

/** 允许不在 SSG 白名单内的 URL 也走动态渲染（避免 404） */
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return { title: '未找到 | 灵境阁·藏经阁' };
  }
  const description = (article.translation || article.content)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 120);
  return {
    title: `${article.title} | 灵境阁·藏经阁`,
    description,
    keywords: [article.title, article.source || '典籍', '藏经阁', '古文', '经典'],
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { category, slug } = params;
  const decodedCategory = decodeURIComponent(category);
  const decodedSlug = decodeURIComponent(slug);

  const article: Article | null = await getArticleBySlug(decodedSlug);

  if (!article) {
    // 客户端兜底：让 [category]/page.tsx 的 'use client' 找不到时也走 SSG 的 404
    return (
      <div className="min-h-screen bg-[#f5f0eb]">
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Link href={`/zang/library/${encodeURIComponent(decodedCategory)}`} className="text-sm text-gray-500 hover:text-[#2c2c2c] mb-4 inline-flex items-center gap-1">
            <span>←</span>
            <span>返回目录</span>
          </Link>
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-500 border border-gray-100">
            <div className="text-4xl mb-3">📭</div>
            <p>未找到 &quot;{decodedSlug}&quot; 对应的内容</p>
          </div>
        </main>
      </div>
    );
  }

  return <ArticleDetailClient article={article} category={decodedCategory} />;
}
