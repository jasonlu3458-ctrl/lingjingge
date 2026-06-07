'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  source: string | null;
  category: string | null;
  created_at: string;
}

// 模拟数据（当 Supabase 未配置时使用）
const mockArticles: Article[] = [
  { id: '1', slug: 'dao-de-jing-chapter-1', title: '道德经·第一章', content: '道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。故常无欲，以观其妙；常有欲，以观其徼。此两者同出而异名，同谓之玄，玄之又玄，众妙之门。', source: '老子', category: 'classics', created_at: '2024-01-01T00:00:00Z' },
  { id: '2', slug: 'liu-zu-tan-jing-xing-you-pin', title: '六祖坛经·行由品', content: '菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。', source: '慧能', category: 'classics', created_at: '2024-01-02T00:00:00Z' },
  { id: '3', slug: 'yi-jing-qian-gua', title: '易经·乾卦', content: '乾：元，亨，利，贞。初九：潜龙，勿用。九二：见龙在田，利见大人。九三：君子终日乾乾，夕惕若厉，无咎。九四：或跃在渊，无咎。九五：飞龙在天，利见大人。上九：亢龙，有悔。用九：见群龙无首，吉。', source: '周文王', category: 'classics', created_at: '2024-01-03T00:00:00Z' },
  { id: '4', slug: 'jin-gang-jing-chapter-1', title: '金刚经·第一品', content: '如是我闻，一时佛在舍卫国祇树给孤独园，与大比丘众千二百五十人俱。尔时世尊食时，著衣持钵，入舍卫大城乞食。', source: '释迦牟尼', category: 'classics', created_at: '2024-01-04T00:00:00Z' },
];

const mockTerms: Article[] = [
  { id: 't1', slug: 'jian-xing', title: '见性', content: '禅宗术语，指彻见自心本性。即通过修行，破除妄想执着，直接体认自己本来具有的佛性。见性是禅宗修行的核心目标，也是悟道的标志。', source: null, category: 'treasure', created_at: '2024-01-01T00:00:00Z' },
  { id: 't2', slug: 'wu-ming', title: '无明', content: '佛教术语，指众生心中无有智慧，处于黑暗状态。无明是烦恼的根源，是生死轮回的根本原因。破除无明是修行的首要任务。', source: null, category: 'treasure', created_at: '2024-01-02T00:00:00Z' },
  { id: 't3', slug: 'bo-re', title: '般若', content: '梵语，意为智慧，特指超越世俗的智慧。般若智慧不同于普通的知识，它是能够洞察诸法实相、破除执着的根本智慧。', source: null, category: 'treasure', created_at: '2024-01-03T00:00:00Z' },
  { id: 't4', slug: 'wu-wei', title: '无为', content: '道家思想，顺其自然，不妄为。无为不是无所作为，而是指顺应事物的自然规律，不强行干预，以达到无为而无不为的境界。', source: null, category: 'treasure', created_at: '2024-01-04T00:00:00Z' },
];

export default function LibraryPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [terms, setTerms] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = ['全部', '佛经', '道家', '易经', '禅宗', '儒学'];

  // 从 Supabase 获取数据
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // 检查 Supabase 是否配置
        if (!isSupabaseConfigured()) {
          console.log('Supabase 未配置，使用模拟数据');
          setArticles(mockArticles);
          setTerms(mockTerms);
          setLoading(false);
          return;
        }

        // 获取典籍文章 (classics)
        const { data: classicsData, error: classicsError } = await supabase
          .from('articles')
          .select('*')
          .eq('category', 'classics')
          .order('created_at', { ascending: false });

        if (classicsError) throw classicsError;
        const articlesData = classicsData || [];
        
        // 如果数据库中没有数据，使用模拟数据
        if (articlesData.length === 0) {
          setArticles(mockArticles);
        } else {
          setArticles(articlesData);
        }

        // 获取术语 (treasure)
        const { data: treasureData, error: treasureError } = await supabase
          .from('articles')
          .select('*')
          .eq('category', 'treasure')
          .order('created_at', { ascending: false });

        if (treasureError) throw treasureError;
        const termsData = treasureData || [];
        
        // 如果数据库中没有数据，使用模拟数据
        if (termsData.length === 0) {
          setTerms(mockTerms);
        } else {
          setTerms(termsData);
        }

      } catch (err) {
        console.error('获取数据失败:', err);
        // 使用模拟数据作为后备
        setArticles(mockArticles);
        setTerms(mockTerms);
        setError('加载数据失败，已切换到演示模式');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // 过滤文章
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // 过滤术语
  const filteredTerms = terms.filter(term =>
    term.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    term.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 生成简介（截取内容前50字）
  const generateExcerpt = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}>
            藏经阁
          </h1>
          <p className="text-gray-500 text-sm">探索经典智慧，领悟东方哲学</p>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-400 border-t-transparent"></div>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* 搜索栏 */}
        {!loading && (
          <>
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索经典、术语..."
                  className="w-full px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
            </div>

            {/* 经典典籍 */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                📚 经典典籍
              </h2>
              {filteredArticles.length > 0 ? (
                <div className="space-y-4">
                  {filteredArticles.map((article) => (
                    <Link 
                      key={article.id} 
                      href={`/zang/library/${article.slug}`}
                      className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-100"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                              {article.category || '经典'}
                            </span>
                            <span className="text-xs text-gray-400">👤 {article.source || '未知'}</span>
                          </div>
                          <h3 className="text-lg font-medium text-gray-800 mb-2 hover:text-gray-600 transition-colors"
                              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">{generateExcerpt(article.content)}</p>
                        </div>
                        <div className="text-xs text-gray-400 whitespace-nowrap ml-4">
                          →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-4">📖</div>
                  <p style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>暂无相关典籍</p>
                </div>
              )}
            </div>

            {/* 术语百科 */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                📖 术语百科
              </h2>
              {filteredTerms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTerms.map((term) => (
                    <Link
                      key={term.id}
                      href={`/zang/library/${term.slug}`}
                      className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-emerald-700"
                            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                          {term.title}
                        </h3>
                        <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
                          {term.category || '术语'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{generateExcerpt(term.content)}</p>
                      <div className="text-xs text-gray-400">→</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-4">📖</div>
                  <p style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>暂无相关术语</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
