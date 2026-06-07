'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import supabase from '@/lib/supabase';

interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  source: string | null;
  category: string | null;
  created_at: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('articles')
          .select('*')
          .eq('slug', slug)
          .single();

        if (fetchError) {
          setError(`加载失败: ${fetchError.message}`);
        } else {
          setArticle(data as Article);
        }
      } catch (err) {
        setError(`获取文章异常: ${err instanceof Error ? err.message : '未知错误'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-400 border-t-transparent"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 p-8">
        <div className="max-w-3xl mx-auto">
          <Link 
            href="/zang/library" 
            className="inline-block mb-6 text-gray-600 hover:text-gray-800 transition-colors"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            ← 返回文章列表
          </Link>
          <div className="bg-white rounded-xl p-8 border border-gray-200">
            <h3 className="text-xl text-red-600 mb-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>加载失败</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📖</div>
          <p className="text-gray-500">文章不存在</p>
          <Link 
            href="/zang/library" 
            className="mt-4 inline-block text-gray-600 hover:text-gray-800 transition-colors"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            返回文章列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 返回链接 */}
        <Link 
          href="/zang/library" 
          className="inline-block mb-6 text-gray-600 hover:text-gray-800 transition-colors"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
        >
          ← 返回文章列表
        </Link>

        {/* 文章标题 */}
        <article className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
              {article.category || '经典'}
            </span>
            <span className="text-xs text-gray-400">
              👤 {article.source || '未知'}
            </span>
          </div>
          
          <h1 
            className="text-3xl font-bold text-gray-800 mb-6"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}
          >
            {article.title}
          </h1>

          {/* 文章内容 */}
          <div 
            className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", lineHeight: '2' }}
          >
            {article.content}
          </div>
        </article>

        {/* 文章信息 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>📅 {new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
            <Link 
              href="/zang/library" 
              className="text-amber-600 hover:text-amber-700 transition-colors"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            >
              查看更多典籍 →
            </Link>
          </div>
        </div>

        {/* 返回链接 */}
        <div className="text-center mt-8">
          <Link 
            href="/zang/library" 
            className="text-gray-600 hover:text-gray-800 transition-colors"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            ← 返回文章列表
          </Link>
        </div>
      </main>
    </div>
  );
}
