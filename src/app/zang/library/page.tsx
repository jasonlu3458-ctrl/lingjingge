'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '@/lib/supabase';

interface SourceCard {
  source: string;
  categorySlug: string;
  category: string | null;
  count: number;
  excerpt: string;
}

// source 名 -> category slug 的映射（用于 /zang/library/[category] 路由）
const sourceToCategorySlug: Record<string, string> = {
  '老子': 'laozi',
  '慧能': 'huineng',
  '释迦牟尼': 'shijiamouni',
  '周文王': 'zhouwenwang',
};

// 兜底数据：演示模式下显示
const mockSourceList: SourceCard[] = [
  { source: '老子',     categorySlug: 'laozi',        category: 'classics', count: 81, excerpt: '道家思想创始人，著《道德经》五千言，奠定中华哲学根基。' },
  { source: '慧能',     categorySlug: 'huineng',      category: 'classics', count: 1,  excerpt: '禅宗六祖，主张"心性本净、佛性本有"，开创顿悟法门。' },
  { source: '释迦牟尼', categorySlug: 'shijiamouni',  category: 'classics', count: 1,  excerpt: '佛教创始者，乔达摩·悉达多，证悟无上正等正觉。' },
  { source: '周文王',   categorySlug: 'zhouwenwang',  category: 'classics', count: 1,  excerpt: '演绎八卦为六十四卦，著《周易》，被尊为"文化始祖"。' },
];

// 兜底：取 source 的简介（每个来源一行简介）
const sourceBio: Record<string, string> = {
  '老子': '道家思想创始人，著《道德经》五千言，奠定中华哲学根基。',
  '慧能': '禅宗六祖，主张"心性本净、佛性本有"，开创顿悟法门。',
  '释迦牟尼': '佛教创始者，乔达摩·悉达多，证悟无上正等正觉。',
  '周文王': '演绎八卦为六十四卦，著《周易》，被尊为"文化始祖"。',
};

interface TermCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
  source: string | null;
}

// 兜底：术语百科数据
const mockTerms: TermCard[] = [
  { id: 't1', slug: 'jian-xing', title: '见性', category: '禅宗', source: '慧能', excerpt: '禅宗术语，指彻见自心本性。即通过修行，破除妄想执着，直接体认自己本来具有的佛性。' },
  { id: 't2', slug: 'wu-ming',   title: '无明', category: '佛教', source: '释迦牟尼', excerpt: '佛教术语，指众生心中无有智慧，处于黑暗状态。无明是烦恼的根源，是生死轮回的根本原因。' },
  { id: 't3', slug: 'bo-re',     title: '般若', category: '佛教', source: '释迦牟尼', excerpt: '梵语，意为智慧，特指超越世俗的智慧。般若智慧不同于普通的知识，它能洞察实相、破除执着的根本智慧。' },
  { id: 't4', slug: 'wu-wei',    title: '无为', category: '道家', source: '老子', excerpt: '道家思想，顺其自然，不妄为。无为不是无所作为，而是指顺应事物的自然规律，不强行干预以达到无不为的境界。' },
  { id: 't5', slug: 'tai-ji',    title: '太极', category: '易经', source: '周文王', excerpt: '易学概念，指宇宙万物的本源。太极生两仪，两仪生四象，四象生八卦。' },
  { id: 't6', slug: 'wu-xing',   title: '五行', category: '道家', source: '老子', excerpt: '金、木、水、火、土五种基本元素，代表宇宙万物的构成和相互关系。' },
  { id: 't7', slug: 'yuan-ming', title: '圆明', category: '禅宗', source: '慧能', excerpt: '圆满光明的本性，指众生本具的清净佛性。' },
  { id: 't8', slug: 'pu-sa',     title: '菩萨', category: '佛教', source: '释迦牟尼', excerpt: '菩提萨埵的简称，意译为"觉有情"，是上求佛道、下化众生的修行者。' },
];

// 摘要生成：截取内容前 50 字
const generateExcerpt = (content: string, maxLength = 50) => {
  if (!content) return '';
  const cleaned = content.replace(/\s+/g, ' ').trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) + '...' : cleaned;
};

export default function LibraryPage() {
  const [sourceList, setSourceList] = useState<SourceCard[]>(mockSourceList);
  const [terms, setTerms] = useState<TermCard[]>(mockTerms);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isSupabaseConfigured()) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const ok = await testSupabaseConnection();
        if (!ok) {
          if (mounted) setLoading(false);
          return;
        }
        // 拉所有 classics 分类的文章
        const { data, error } = await supabase
          .from('articles')
          .select('source, slug, category, content')
          .eq('category', 'classics');
        if (!mounted) return;
        if (!error && data && data.length > 0) {
          // 按 source 分组，统计数量 + 摘要
          const map = new Map<string, SourceCard>();
          data.forEach((row: any) => {
            const source: string = row.source || '佚名';
            if (!map.has(source)) {
              map.set(source, {
                source,
                categorySlug: sourceToCategorySlug[source] || encodeURIComponent(source),
                category: row.category ?? null,
                count: 0,
                excerpt: (row.content || '').slice(0, 50),
              });
            }
            map.get(source)!.count += 1;
          });
          const list = Array.from(map.values()).map((c) => ({
            ...c,
            excerpt: c.excerpt || sourceBio[c.source] || '点击进入目录。',
          }));
          setSourceList(list);
        }
      } catch (e) {
        console.error('拉取来源失败，使用兜底数据', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 拉取术语 (category='treasure')
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const ok = await testSupabaseConnection();
        if (!ok) return;
        const { data, error } = await supabase
          .from('articles')
          .select('id, slug, title, content, source, category, created_at')
          .eq('category', 'treasure')
          .order('created_at', { ascending: true });
        if (!mounted) return;
        if (!error && data && data.length > 0) {
          const list: TermCard[] = (data as any[]).map((row) => ({
            id: row.id,
            slug: row.slug,
            title: row.title,
            excerpt: generateExcerpt(row.content || ''),
            category: row.category ?? null,
            source: row.source ?? null,
          }));
          setTerms(list);
        }
      } catch (e) {
        console.error('拉取术语失败，使用兜底数据', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-gray-800 mb-2"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}
          >
            藏经阁
          </h1>
          <p className="text-gray-500 text-sm">探索经典智慧，领悟东方哲学</p>
        </div>

        <h2
          className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
        >
          📚 典籍来源 ({sourceList.length} 位先贤)
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-400 border-t-transparent"></div>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {sourceList.map((item) => (
              <Link
                key={item.source}
                href={`/zang/library/${item.categorySlug}`}
                className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📜</span>
                  <div
                    className="text-base font-serif text-gray-800 truncate"
                    style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                  >
                    {item.source}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-1.5 line-clamp-2 leading-relaxed">
                  {item.excerpt}
                </div>
                <div className="text-xs text-gray-400">
                  {item.count} 章
                  {item.category && (
                    <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                      {item.category === 'classics' ? '经典' : item.category === 'treasure' ? '术语' : '随笔'}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 术语百科 */}
        <div className="mt-10 flex items-center justify-between mb-4">
          <h2
            className="text-lg font-bold text-gray-800 flex items-center gap-2"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            📖 术语百科 ({terms.length} 条)
          </h2>
          <Link
            href="/zang/library/terms"
            className="text-xs text-[#b88a4a] hover:underline"
          >
            查看全部 →
          </Link>
        </div>

        {terms.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">📖</div>
            <p>暂无相关术语</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {terms.map((term) => (
              <Link
                key={term.id}
                href="/zang/library/terms"
                className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔖</span>
                  <div
                    className="text-base font-serif text-gray-800 truncate"
                    style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                  >
                    {term.title}
                  </div>
                </div>
                <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-2 min-h-[3rem]">
                  {term.excerpt}
                </p>
                <div className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
                  {term.category && (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                      {term.category}
                    </span>
                  )}
                  {term.source && (
                    <span className="text-gray-500">· {term.source}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
