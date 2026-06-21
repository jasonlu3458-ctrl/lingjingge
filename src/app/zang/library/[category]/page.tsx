'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '@/lib/supabase';
import { mockDaoDeJing, type MockArticle } from '../mock-dao-de-jing';

type Article = MockArticle;

// category slug (URL) -> author 中文名 (数据库 articles.author 字段值)
const categoryToAuthor: Record<string, string> = {
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

  const authorName = categoryToAuthor[categorySlug] || categorySlug;
  const meta = categoryMeta[categorySlug] || {
    name: authorName,
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
            // 这里根据映射查 author 字段
            const { data, error: sbErr } = await supabase
              .from('articles')
              .select('id, slug, title, content, source, category, created_at')
              .eq('source', authorName)
              .order('created_at', { ascending: true });
            if (!mounted) return;
            if (!sbErr && data && data.length > 0) {
              // 老子特殊处理：DB + mockDaoDeJing 合并（DB 优先，缺章用 mock 补足到 81）
              if (categorySlug === 'laozi') {
                const dbRows = data as Article[];
                // 用 mockDaoDeJing 做模板：81 章位置稳定，DB 命中就替换
                const merged: Article[] = mockDaoDeJing.map((mock) => {
                  const hit = dbRows.find((d) => d.slug === mock.slug);
                  return hit ? { ...mock, ...hit } : mock;
                });
                // DB 里有但 mock 里没有的（比如未来新章节）追加到末尾
                dbRows.forEach((d) => {
                  if (!mockDaoDeJing.some((m) => m.slug === d.slug)) {
                    merged.push(d);
                  }
                });
                setArticles(merged);
                setLoading(false);
                return;
              }
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
          setError(`暂无 "${authorName}" 的典籍收录，敬请期待。`);
        }
        setArticles(fallback);
      } catch (e: any) {
        setError(e?.message || '加载失败');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [categorySlug, authorName]);

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const isLongSeries = articles.length > 1;

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <main className="max-w-6xl mx-auto px-4 py-8">
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

        {/* AI 经典导读区块（顶部引导入口） */}
        <AiIntroCard
          authorName={meta.name}
          articleCount={articles.length}
          unit={isLongSeries ? '章' : '部'}
          categorySlug={categorySlug}
        />

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((article) => (
              <Link
                key={article.id}
                href={`/zang/library/${categorySlug}/${article.slug}`}
                className="group block rounded-2xl p-5 sm:p-6 transition-all duration-300 border border-amber-200/60 bg-[#fbf6ec]/80 hover:bg-white hover:border-[#b88a4a]/60 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-700 text-xs font-bold tracking-widest">
                    {String(articles.indexOf(article) + 1).padStart(2, '0')}
                  </div>
                  <h3
                    className="flex-1 min-w-0 font-serif text-[#2c2c2c] group-hover:text-[#b88a4a] transition-colors leading-snug"
                    style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif", fontSize: '1.15rem' }}
                  >
                    {article.title}
                  </h3>
                </div>
                {/* 副标题：本小节第一句原文（前 15 字） */}
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 min-h-[2.5rem] italic">
                  {article.content
                    ? article.content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 15) + '…'
                    : '…'}
                </p>
                <div className="mt-3 pt-3 border-t border-amber-100/60 flex items-center justify-between text-[11px] text-amber-700/70 tracking-widest">
                  <span>{article.source || '典籍'}</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">展卷 →</span>
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

/**
 * AI 经典导读卡片
 * 静态引导文案 + 点击按钮调 Dify 藏经 AI 助教
 */
function AiIntroCard({
  authorName,
  articleCount,
  unit,
  categorySlug,
}: {
  authorName: string;
  articleCount: number;
  unit: string;
  categorySlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [reply, setReply] = useState('');
  const [err, setErr] = useState('');

  // 三大核心哲思（按 category 给不同侧重）
  const themes = AI_INTRO_THEMES[categorySlug] || AI_INTRO_THEMES.default;

  async function handleGenerate() {
    if (streaming) return;
    setOpen(true);
    setStreaming(true);
    setReply('');
    setErr('');

    const prompt = `请为 ${authorName}（${articleCount}${unit}）写一段"AI 经典导读"，300-400 字。要求：\n1. 用 3 个核心哲思主题展开；\n2. 每条配一个现代生活案例；\n3. 末尾给出一句"今日可行动"建议。`;

    try {
      const res = await fetch('/api/zang/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: authorName,
          passage: themes.summary,
          prompt,
          prior: '',
        }),
      });
      if (!res.ok) {
        setErr(`请求失败 ${res.status}`);
        setStreaming(false);
        return;
      }
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let acc = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx: number;
            while ((idx = buffer.indexOf('\n\n')) !== -1) {
              const raw = buffer.slice(0, idx);
              buffer = buffer.slice(idx + 2);
              for (const line of raw.split('\n')) {
                if (!line.startsWith('data:')) continue;
                const payload = line.slice(5).trim();
                if (!payload || payload === '[DONE]') continue;
                try {
                  const obj = JSON.parse(payload);
                  if (obj.event === 'message' && typeof obj.answer === 'string') {
                    acc += obj.answer;
                    setReply(acc);
                  } else if (obj.event === 'message_end') {
                    setStreaming(false);
                  }
                } catch { /* ignore */ }
              }
            }
          }
        } finally {
          try { reader.releaseLock(); } catch { /* ignore */ }
        }
        setStreaming(false);
      } else {
        const json = await res.json();
        setReply(json.content || '');
        setStreaming(false);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : '网络错误');
      setStreaming(false);
    }
  }

  return (
    <section
      aria-label="AI 经典导读"
      className="mb-6 sm:mb-8 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-[#fdf7e6] via-[#fbf3df] to-[#f7ebd1] p-5 sm:p-7 shadow-sm"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-md">
          📖
        </div>
        <div className="flex-1 min-w-0">
          <h2
            className="text-lg sm:text-xl font-bold text-[#5a3e1a] tracking-wide"
            style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
          >
            AI 经典导读
          </h2>
          <p className="mt-2 text-sm text-amber-900/80 leading-relaxed">
            此经典 <span className="font-bold text-amber-700">{articleCount} {unit}</span>，AI 为你提炼了三大核心哲思：
            <span className="block mt-1.5 text-amber-800">
              {themes.list.map((t, i) => (
                <span key={i}>
                  <span className="font-medium">{t.name}</span>
                  <span className="text-amber-700/60">（{t.hint}）</span>
                  {i < themes.list.length - 1 && <span className="mx-1.5 text-amber-400">·</span>}
                </span>
              ))}
            </span>
            <span className="block mt-2 italic text-amber-700/80">点此生成你的专属解读。</span>
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={streaming}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{streaming ? '生成中…' : '✨ 生成我的专属解读'}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-5 pt-5 border-t border-amber-300/50">
          {err && <p className="text-sm text-amber-700 mb-2">⚠️ {err}</p>}
          {reply ? (
            <div
              className="text-sm leading-relaxed text-amber-950 whitespace-pre-wrap"
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif", fontSize: '0.95rem' }}
            >
              {reply}
              {streaming && <span className="inline-block w-1.5 h-3 ml-1 bg-amber-700 animate-pulse align-middle" />}
            </div>
          ) : streaming ? (
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <div className="w-4 h-4 rounded-full border-2 border-amber-300 border-t-amber-700 animate-spin" />
              <span>AI 正在为你解读…</span>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

/** 三大核心哲思（按经典分类） */
const AI_INTRO_THEMES: Record<string, { summary: string; list: Array<{ name: string; hint: string }> }> = {
  laozi: {
    summary: '道德经五千言，核心在"道法自然"四字。',
    list: [
      { name: '无为而治', hint: '不强行、不妄为' },
      { name: '柔弱胜刚强', hint: '水之哲学' },
      { name: '少则得，多则惑', hint: '减法人生' },
    ],
  },
  shijiamouni: {
    summary: '般若系经典，核心在"破相显性"。',
    list: [
      { name: '诸相非相', hint: '不住于相' },
      { name: '应无所住', hint: '心无挂碍' },
      { name: '一切有为法', hint: '如梦幻泡影' },
    ],
  },
  huineng: {
    summary: '禅宗顿悟法门，核心在"心性本净"。',
    list: [
      { name: '明心见性', hint: '顿悟本心' },
      { name: '无念为宗', hint: '不起妄念' },
      { name: '佛法在世间', hint: '不离日用' },
    ],
  },
  zhouwenwang: {
    summary: '易经推演变化之理，核心在"时位中应"。',
    list: [
      { name: '穷则变', hint: '通变思维' },
      { name: '时止则止', hint: '顺时而行' },
      { name: '中正平和', hint: '执两用中' },
    ],
  },
  default: {
    summary: '此部经典凝聚先贤智慧。',
    list: [
      { name: '修身之要', hint: '内观自省' },
      { name: '处世之道', hint: '和而不同' },
      { name: '天地之理', hint: '天人合一' },
    ],
  },
};
