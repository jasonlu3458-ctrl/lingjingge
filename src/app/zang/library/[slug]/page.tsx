'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '@/lib/supabase';

interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  source: string | null;
  category: string | null;
  created_at: string;
}

// 模拟文章数据
const mockArticles: Article[] = [
  { id: '1', slug: 'dao-de-jing-chapter-1', title: '道德经·第一章', content: '道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。故常无欲，以观其妙；常有欲，以观其徼。此两者同出而异名，同谓之玄。玄之又玄，众妙之门。', source: '老子', category: 'classics', created_at: '2024-01-01T00:00:00Z' },
  { id: '2', slug: 'liu-zu-tan-jing-xing-you-pin', title: '六祖坛经·行由品', content: '菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。', source: '慧能', category: 'classics', created_at: '2024-01-02T00:00:00Z' },
  { id: '3', slug: 'yi-jing-qian-gua', title: '易经·乾卦', content: '乾：元，亨，利，贞。初九：潜龙，勿用。九二：见龙在田，利见大人。九三：君子终日乾乾，夕惕若厉，无咎。九四：或跃在渊，无咎。九五：飞龙在天，利见大人。上九：亢龙，有悔。用九：见群龙无首，吉。', source: '周文王', category: 'classics', created_at: '2024-01-03T00:00:00Z' },
];

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchArticle = async () => {
      try {
        if (!mounted) return;
        setLoading(true);
        setError(null);

        // 检查 Supabase 是否配置
        if (!isSupabaseConfigured()) {
          console.log('Supabase 未配置，使用模拟数据');
          const mockArticle = mockArticles.find(a => a.slug === slug);
          if (mounted) {
            setArticle(mockArticle || null);
            setLoading(false);
          }
          return;
        }

        // 先测试数据库连接
        console.log('正在测试数据库连接...');
        const connectionOk = await testSupabaseConnection();
        
        if (!connectionOk) {
          console.log('数据库连接失败，使用模拟数据');
          const mockArticle = mockArticles.find(a => a.slug === slug);
          if (mounted) {
            setArticle(mockArticle || null);
            setError('数据库连接失败，已切换到演示模式');
            setLoading(false);
          }
          return;
        }

        console.log('数据库连接成功，开始获取文章...');

        const { data, error: fetchError } = await supabase
          .from('articles')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!mounted) return;

        if (fetchError) {
          console.error('获取文章失败:', fetchError);
          // 如果数据库查询失败，尝试从模拟数据中查找
          const mockArticle = mockArticles.find(a => a.slug === slug);
          setArticle(mockArticle || null);
          setError(`数据库查询失败，已尝试演示数据`);
        } else {
          setArticle(data as Article);
        }
      } catch (err) {
        console.error('获取文章异常:', err);
        const mockArticle = mockArticles.find(a => a.slug === slug);
        if (mounted) {
          setArticle(mockArticle || null);
          setError(`获取文章异常: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchArticle();

    return () => {
      mounted = false;
    };
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
