'use client';

import { useState, useEffect } from 'react';
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

// category slug (URL) -> source 中文名 (数据库字段)
const categoryToSource: Record<string, string> = {
  laozi: '老子',
  huineng: '慧能',
  shijiamouni: '释迦牟尼',
  zhouwenwang: '周文王',
};

// 兜底：每个 category 的元信息
const categoryMeta: Record<string, { name: string; era: string; bio: string; icon: string }> = {
  laozi: { name: '老子', era: '春秋时期', bio: '道家思想创始人，著《道德经》五千言，奠定中华哲学根基。', icon: '☯️' },
  huineng: { name: '慧能', era: '唐代', bio: '禅宗六祖，主张"心性本净、佛性本有"，开创顿悟法门。', icon: '🙏' },
  shijiamouni: { name: '释迦牟尼', era: '公元前6世纪', bio: '佛教创始者，乔达摩·悉达多，证悟无上正等正觉。', icon: '🪷' },
  zhouwenwang: { name: '周文王', era: '商末周初', bio: '演绎八卦为六十四卦，著《周易》，被尊为"文化始祖"。', icon: '☯️' },
};

// 兜底数据：道德经 81 章
const mockDaoDeJing: Article[] = Array.from({ length: 81 }, (_, i) => ({
  id: `dj${i + 1}`,
  slug: `dao-de-jing-chapter-${i + 1}`,
  title: `道德经·第${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十',
    '三十一', '三十二', '三十三', '三十四', '三十五', '三十六', '三十七', '三十八', '三十九', '四十',
    '四十一', '四十二', '四十三', '四十四', '四十五', '四十六', '四十七', '四十八', '四十九', '五十',
    '五十一', '五十二', '五十三', '五十四', '五十五', '五十六', '五十七', '五十八', '五十九', '六十',
    '六十一', '六十二', '六十三', '六十四', '六十五', '六十六', '六十七', '六十八', '六十九', '七十',
    '七十一', '七十二', '七十三', '七十四', '七十五', '七十六', '七十七', '七十八', '七十九', '八十',
    '八十一'][i]}章`,
  content: `道德经第 ${i + 1} 章内容（兜底数据）。`,
  source: '老子',
  category: 'classics',
  created_at: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
}));

const mockByCategory: Record<string, Article[]> = {
  laozi: mockDaoDeJing,
  huineng: [{ id: 'lztj1', slug: 'liu-zu-tan-jing', title: '六祖坛经', content: '六祖坛经是禅宗六祖慧能所说，由弟子法海集录，是禅宗根本经典之一。', source: '慧能', category: 'classics', created_at: '2024-02-01T00:00:00Z' }],
  shijiamouni: [{ id: 'jgj1', slug: 'jin-gang-jing', title: '金刚经', content: '《金刚般若波罗蜜经》是大乘佛教般若系统的重要经典。', source: '释迦牟尼', category: 'classics', created_at: '2024-03-01T00:00:00Z' }],
  zhouwenwang: [{ id: 'yj1', slug: 'yi-jing-overview', title: '易经·总述', content: '《易经》是阐述天地万物变化的古老经典，是群经之首。', source: '周文王', category: 'classics', created_at: '2024-04-01T00:00:00Z' }],
};

export default function CategoryPage() {
  const params = useParams<{ category: string }>();
  const categorySlug = decodeURIComponent(params?.category || '');

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sourceName = categoryToSource[categorySlug] || categorySlug;
  const meta = categoryMeta[categorySlug] || {
    name: sourceName,
    era: '',
    bio: '点击下方章节进入阅读。',
    icon: '📜',
  };

  useEffect(() => {
    let mounted = true;
    if (!categorySlug) {
      setError('未指定分类');
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (isSupabaseConfigured()) {
          const ok = await testSupabaseConnection();
          if (ok) {
            // 数据库里的 category 字段值（如 'classics'/'treasure'）与 URL 的 category slug 含义不同
            // 这里根据映射查 source 字段
            const { data, error: sbErr } = await supabase
              .from('articles')
              .select('id, slug, title, content, source, category, created_at')
              .eq('source', sourceName)
              .order('created_at', { ascending: true });
            if (!mounted) return;
            if (!sbErr && data && data.length > 0) {
              setArticles(data as Article[]);
              setLoading(false);
              return;
            }
          }
        }
        // 兜底
        await new Promise((r) => setTimeout(r, 200));
        const fallback = mockByCategory[categorySlug] || [];
        if (fallback.length === 0) {
          setError(`未找到 "${categorySlug}" 的典籍，请检查 Supabase 数据库或运行建表 SQL。`);
        }
        setArticles(fallback);
      } catch (e: any) {
        setError(e?.message || '加载失败');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [categorySlug, sourceName]);

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const isLongSeries = articles.length > 1;

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/zang/library" className="text-sm text-gray-500 hover:text-[#2c2c2c] mb-4 inline-flex items-center gap-1">
          <span>←</span>
          <span>返回藏经阁</span>
        </Link>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-6 border border-gray-100">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="text-5xl sm:text-6xl flex-shrink-0">{meta.icon}</div>
            <div className="flex-1 min-w-0">
              <h1
                className="text-3xl sm:text-4xl font-serif text-[#2c2c2c] mb-2"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {meta.name}
              </h1>
              {meta.era && <div className="text-sm text-amber-700 mb-2">📅 {meta.era}</div>}
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-3">{meta.bio}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full">
                  📚 {articles.length} {isLongSeries ? '章' : '部'}
                </span>
                {articles[0]?.category && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                    🏷️ {articles[0].category === 'classics' ? '经典典籍' : '其他'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {isLongSeries && (
          <div className="mb-4">
            <input
              type="text"
              placeholder={`🔍 在 ${meta.name} 著作中搜索...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#b88a4a] focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600 mb-3" />
            <p className="text-sm text-gray-500">正在加载 {meta.name} 著作...</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className={isLongSeries ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-3'}>
            {filtered.map((article) => (
              <Link
                key={article.id}
                href={`/zang/library/${categorySlug}/${article.slug}`}
                className="group block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-serif text-[#2c2c2c] group-hover:text-[#b88a4a] transition-colors ${isLongSeries ? 'truncate' : ''}`}
                      style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                    >
                      {article.title}
                    </h3>
                    {article.content && isLongSeries && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {article.content.substring(0, 60)}...
                      </p>
                    )}
                  </div>
                  <span className="text-gray-400 group-hover:text-amber-600 transition-colors flex-shrink-0">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && articles.length > 0 && (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p>未找到包含 &ldquo;{searchQuery}&rdquo; 的内容</p>
          </div>
        )}

        {!loading && articles.length === 0 && !error && (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>暂无 {meta.name} 的典籍</p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/zang/library"
              className="inline-block px-6 py-2.5 text-sm text-[#b88a4a] border border-[#b88a4a] rounded-full hover:bg-[#b88a4a] hover:text-white transition-colors"
            >
              ← 返回藏经阁
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
