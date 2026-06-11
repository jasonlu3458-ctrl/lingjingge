'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '@/lib/supabase';

interface SourceCard {
  master: string;      // 作者
  work: string;        // 典籍
  unit: string;        // 计量单位
  categorySlug: string;
  category: string | null;
  count: number;
  excerpt: string;
  icon: string;
}

// 作者 ↔ 典籍 一一对应表（藏经阁卡片核心映射）
const workMap: Record<string, SourceCard> = {
  laozi: {
    master: '老子', work: '《道德经》', unit: '章',
    categorySlug: 'laozi', category: 'dao', count: 81,
    excerpt: '道家思想创始人，著《道德经》五千言，奠定中华哲学根基。',
    icon: '☯️',
  },
  zhouwenwang: {
    master: '周文王', work: '《易经》', unit: '卦',
    categorySlug: 'zhouwenwang', category: 'yijing', count: 64,
    excerpt: '商末被纣王囚于羑里，演绎八卦为六十四卦，著卦辞，开易学正统。',
    icon: '☯️',
  },
  shijiamouni: {
    master: '释迦牟尼', work: '《金刚经》', unit: '品',
    categorySlug: 'shijiamouni', category: 'fojing', count: 32,
    excerpt: '佛教创始者，于舍卫城祇树给孤独园说《金刚般若波罗蜜经》。',
    icon: '🪷',
  },
  huineng: {
    master: '慧能', work: '《六祖坛经》', unit: '品',
    categorySlug: 'huineng', category: 'fojing', count: 10,
    excerpt: '禅宗六祖，主张"心性本净、佛性本有"，弟子法海集录其说为《坛经》。',
    icon: '🙏',
  },
};

// 兜底数据（演示模式下展示）
const mockSourceList: SourceCard[] = Object.values(workMap);

// 数据库里 category_id 集合到 workMap key 的映射
const categoryToWorks: Record<number, string[]> = {
  1: ['laozi'],            // 道 → 道德经
  3: ['zhouwenwang'],      // 易经 → 周文王·易经
  4: ['shijiamouni', 'huineng'], // 佛经 → 释迦牟尼·金刚经 + 慧能·坛经
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isSupabaseConfigured()) {
        return;
      }
      try {
        const ok = await testSupabaseConnection();
        if (!ok) {
          return;
        }
        // 只取 classics 范畴的 category_id（1/3/4），并拉 content 用于动态生成 excerpt
        const targetIds = Object.keys(categoryToWorks).map(Number);
        const { data, error } = await supabase
          .from('articles')
          .select('id, slug, category_id, title, content, created_at')
          .in('category_id', targetIds)
          .order('created_at', { ascending: true });
        if (!mounted) return;
        if (!error && data && data.length > 0) {
          // 按 workMap 统计实际数量，并为每张卡取首篇文章生成 excerpt
          const tally: Record<string, number> = {};
          // 各 workMap key 对应的"首篇文章"（按 created_at 升序的第一篇）
          const firstArticle: Record<string, { title: string; content: string }> = {};
          (data as any[]).forEach((row) => {
            const cid = row.category_id as number;
            // 佛经(category_id=4) 用 slug 前缀区分 jingang/tanjing
            let key: string | null = null;
            if (cid === 4) {
              const slug: string = row.slug || '';
              if (slug.startsWith('jingang')) key = 'shijiamouni';
              else if (slug.startsWith('tanjing')) key = 'huineng';
            } else {
              const keys = categoryToWorks[cid] || [];
              if (keys.length > 0) key = keys[0];
            }
            if (!key) return;
            tally[key] = (tally[key] || 0) + 1;
            if (!firstArticle[key] && row.title) {
              firstArticle[key] = { title: row.title, content: row.content || '' };
            }
          });
          // 合并实时数量 + DB 动态 excerpt 到 workMap
          // 老子（laozi）保留 workMap 手写简介；其他 3 张用数据库首篇文章生成
          const list: SourceCard[] = Object.entries(workMap).map(([k, base]) => {
            const dbCount = tally[k];
            const fa = firstArticle[k];
            const isLaozi = k === 'laozi';
            const dynamicExcerpt = fa
              ? (fa.content ? generateExcerpt(fa.content, 60) : fa.title)
              : null;
            return {
              ...base,
              count: dbCount ?? base.count,
              excerpt: isLaozi || !dynamicExcerpt ? base.excerpt : dynamicExcerpt,
            };
          });
          setSourceList(list);
        }
      } catch (e) {
        console.error('拉取来源失败，使用兜底数据', e);
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
          📚 典籍来源 ({sourceList.length + 4} 位先贤)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sourceList.map((item) => (
            <Link
              key={item.categorySlug}
              href={`/zang/library/${item.categorySlug}`}
              className="group block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100"
            >
              {/* 顶部：作者 + 计量单位 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div
                    className="text-base font-serif text-gray-800 truncate"
                    style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                  >
                    {item.master}
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  {item.count} {item.unit}
                </span>
              </div>

              {/* 分隔线 + 典籍（作者-典籍 一一对应） */}
              <div className="border-t border-dashed border-gray-200 my-2" />
              <div
                className="text-lg font-serif text-amber-800 mb-1.5 truncate"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {item.master}—{item.work}
              </div>

              {/* 简介 */}
              <div className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {item.excerpt}
              </div>

              {/* 底部标签 */}
              <div className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                {item.category && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                    {item.category === 'dao' ? '道家'
                      : item.category === 'yijing' ? '易经'
                      : item.category === 'fojing' ? '佛经'
                      : item.category}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* 第二排：黄帝/孔子/孙子/庄子（医·儒·兵·道四家） */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 mt-4">
          {/* 黄帝 - 对应《黄帝内经》 */}
          <Link href="/zang/library/huangdi" className="block">
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xl">🌿</span>
                </div>
                <div>
                  <div className="font-bold">黄帝</div>
                  <div className="text-xs text-gray-500">《黄帝内经》</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">中医理论奠基人，确立阴阳五行学说。</div>
              <div className="mt-2">
                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">医经</span>
              </div>
            </div>
          </Link>

          {/* 孔子 - 对应《论语》 */}
          <Link href="/zang/library/kongzi" className="block">
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">📚</span>
                </div>
                <div>
                  <div className="font-bold">孔子</div>
                  <div className="text-xs text-gray-500">《论语》</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">儒家学派创始人，主张“仁、义、礼、智、信”。</div>
              <div className="mt-2">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">儒家</span>
              </div>
            </div>
          </Link>

          {/* 孙子 - 对应《孙子兵法》 */}
          <Link href="/zang/library/sunzi" className="block">
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-xl">⚔️</span>
                </div>
                <div>
                  <div className="font-bold">孙子</div>
                  <div className="text-xs text-gray-500">《孙子兵法》</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">兵家集大成者，提出“知己知彼，百战不殆”。</div>
              <div className="mt-2">
                <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">兵家</span>
              </div>
            </div>
          </Link>

          {/* 庄子 - 对应《庄子》 */}
          <Link href="/zang/library/zhuangzi" className="block">
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xl">🦋</span>
                </div>
                <div>
                  <div className="font-bold">庄子</div>
                  <div className="text-xs text-gray-500">《庄子》</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">道家思想集大成者，逍遥自在，与老子并称“老庄”。</div>
              <div className="mt-2">
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">道家</span>
              </div>
            </div>
          </Link>
        </div>

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
