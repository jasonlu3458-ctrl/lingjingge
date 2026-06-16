'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '@/lib/supabase';
import { useUserRole } from '@/hooks/useUserRole';
import ReportPaywall from '@/components/ReportPaywall';
import { mockDaoDeJing, type MockArticle } from '../../mock-dao-de-jing';

type Article = MockArticle;

// 单文章兜底
const singleMock: Record<string, Article> = {
  'liu-zu-tan-jing': { id: 'lztj1', slug: 'liu-zu-tan-jing', title: '六祖坛经', content: '六祖坛经是禅宗六祖慧能所说，由弟子法海集录，是禅宗根本经典之一。', source: '慧能', category: 'classics', created_at: '2024-02-01T00:00:00Z' },
  'jin-gang-jing':   { id: 'jgj1',  slug: 'jin-gang-jing',   title: '金刚经',   content: '《金刚般若波罗蜜经》是大乘佛教般若系统的重要经典。', source: '释迦牟尼', category: 'classics', created_at: '2024-03-01T00:00:00Z' },
  'yi-jing-overview':{ id: 'yj1',   slug: 'yi-jing-overview',title: '易经·总述',content: '《易经》是阐述天地万物变化的古老经典，是群经之首。', source: '周文王', category: 'classics', created_at: '2024-04-01T00:00:00Z' },
};

export default function ArticlePage() {
  const params = useParams<{ category: string; slug: string }>();
  const category = decodeURIComponent(params?.category || '');
  const slug = decodeURIComponent(params?.slug || '');

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!slug) {
        setError('缺少文章标识');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        if (isSupabaseConfigured()) {
          const ok = await testSupabaseConnection();
          if (ok) {
            const { data, error: sbErr } = await supabase
              .from('articles')
              .select('*')
              .eq('slug', slug)
              .maybeSingle();
            if (!mounted) return;
            if (!sbErr && data) {
              setArticle(data as Article);
              setLoading(false);
              return;
            }
          }
        }
        // 兜底：singleMock 优先，再走道德经 81 章 mock 兜底
        let fallback: Article | null = singleMock[slug] ?? null;
        if (!fallback) {
          fallback = mockDaoDeJing.find((a) => a.slug === slug) ?? null;
        }
        if (fallback) {
          setArticle(fallback);
        } else {
          setError(`未找到 "${slug}" 对应的内容`);
        }
      } catch (e: any) {
        setError(e?.message || '加载失败');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-400 border-t-transparent" />
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#f5f0eb]">
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Link href={`/zang/library/${encodeURIComponent(category)}`} className="text-sm text-gray-500 hover:text-[#2c2c2c] mb-4 inline-flex items-center gap-1">
            <span>←</span>
            <span>返回目录</span>
          </Link>
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-500 border border-gray-100">
            <div className="text-4xl mb-3">📭</div>
            <p>{error || '未找到该章节'}</p>
          </div>
        </main>
      </div>
    );
  }

  return <ArticleDetail article={article} category={category} />;
}

function ArticleDetail({ article, category }: { article: Article; category: string }) {
  const [mode, setMode] = useState<'original' | 'translation' | 'both'>('original');
  const userRole = useUserRole();

  // 返回目录链接 — 优先用 category
  const backHref = `/zang/library/${encodeURIComponent(category || article.source || '')}`;
  const backLabel = category ? `返回${category}` : article.source ? `返回${article.source}` : '返回藏经阁';

  // 是否有译文内容
  const hasTranslation = Boolean(article.translation);
  // 译文预览：截取前 80 字作为 freePart 引导
  const translationText = article.translation || '';
  const translationFreePreview = hasTranslation
    ? translationText.length > 80
      ? translationText.slice(0, 80).replace(/\s+/g, ' ').trim() + '…'
      : translationText
    : '白话翻译待添加';
  const translationFull = hasTranslation ? translationText : '';

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href={backHref}
          className="text-sm text-gray-500 hover:text-[#2c2c2c] mb-4 inline-flex items-center gap-1"
        >
          <span>←</span>
          <span>{backLabel}</span>
        </Link>

        <article className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 border border-gray-100">
          <div className="mb-4 flex items-center gap-2 text-sm text-amber-700">
            <span>📜</span>
            <span>{article.source || '典籍'}</span>
            {article.category && <span className="text-gray-400">· {article.category}</span>}
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              原文免费
            </span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-serif text-[#2c2c2c] mb-6"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            {article.title}
          </h1>

          {/* 模式切换 */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-4">
            {([
              ['original', '📜 原文', '免费'],
              ['translation', '🌐 白话', '会员'],
              ['both', '📖 对照', '会员'],
            ] as const).map(([k, label, fee]) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5 ${
                  mode === k
                    ? 'bg-[#b88a4a] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    mode === k
                      ? 'bg-white/20 text-white'
                      : fee === '免费'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {fee}
                </span>
              </button>
            ))}
          </div>

          {mode === 'original' && (
            <div
              className="prose max-w-none leading-loose text-[#2c2c2c]"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          )}
          {mode === 'translation' && (
            <div className="prose max-w-none leading-loose text-[#2c2c2c]">
              <ReportPaywall
                userRole={userRole}
                reportKey={`library-${article.slug}`}
                premiumSections={['完整白话译文', '作者背景', '典故出处']}
                freePart={hasTranslation ? translationFreePreview : '白话翻译待添加'}
                premiumPart={translationFull}
                accentClass="text-amber-300"
              />
            </div>
          )}
          {mode === 'both' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold text-emerald-600 mb-2 tracking-widest">📜 原文（免费）</h3>
                <div
                  className="prose max-w-none leading-loose text-[#2c2c2c]"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </div>
              <div>
                <h3 className="text-xs font-bold text-amber-600 mb-2 tracking-widest">🌐 白话（会员）</h3>
                <div className="prose max-w-none leading-loose text-[#2c2c2c]">
                  <ReportPaywall
                    userRole={userRole}
                    reportKey={`library-${article.slug}-both`}
                    premiumSections={['完整白话译文', '作者背景', '典故出处']}
                    freePart={hasTranslation ? translationFreePreview : '白话翻译待添加'}
                    premiumPart={translationFull}
                    accentClass="text-amber-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 字词注释（DB 里是 HTML，同样用 dangerouslySetInnerHTML 解析） — 永远免费 */}
          {article.annotation && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-[#b88a4a] mb-2">📝 字词注释</h3>
              <div
                className="text-sm text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: article.annotation }}
              />
            </div>
          )}

          {/* 作者按语 — 永远免费 */}
          {article.author_note && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-[#b88a4a] mb-2">✒️ 作者按语</h3>
              <div
                className="text-sm text-gray-700 leading-relaxed italic"
                dangerouslySetInnerHTML={{ __html: article.author_note }}
              />
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
