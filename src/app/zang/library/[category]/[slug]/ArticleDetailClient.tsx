// ============================================================
// ArticleDetailClient —— 藏经篇章详情（Client 端）
// 接收 server-side 预拉好的 article，渲染：
//   · 阅读模式控制栏（contrast / scroll / dark）
//   · 段落 + AI 参详按钮（点击弹抽屉）
//   · 译文 30% 免费 + 70% 会员 + 点评 paywall
// ============================================================

'use client';

import { useCallback, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';
import ReportPaywall from '@/components/ReportPaywall';
import ReadingModeBar, { type ReadingMode } from './ReadingModeBar';
import AiChatDrawer from './AiChatDrawer';
import { splitArticleToParagraphs, splitTranslationForPaywall } from '@/lib/zang-paragraphs';
import type { Article } from '@/lib/zang-data';

export interface ArticleDetailClientProps {
  article: Article;
  category: string;
}

/** 三种模式下的容器样式 */
function containerClass(mode: ReadingMode): string {
  switch (mode) {
    case 'scroll':
      return 'min-h-screen bg-[#f4ead5] text-[#2c2620]';
    case 'dark':
      return 'min-h-screen bg-[#0e1014] text-[#d4d4d4]';
    case 'contrast':
    default:
      return 'min-h-screen bg-[#f5f0eb] text-[#2c2c2c]';
  }
}

function cardClass(mode: ReadingMode): string {
  switch (mode) {
    case 'scroll':
      return 'bg-[#fbf3df] border border-[#d4c4a3] shadow-[0_2px_20px_rgba(120,90,40,0.12)]';
    case 'dark':
      return 'bg-[#181b21] border border-white/10 shadow-2xl';
    case 'contrast':
    default:
      return 'bg-white border border-gray-100 shadow-sm';
  }
}

function titleClass(mode: ReadingMode): string {
  switch (mode) {
    case 'scroll':
      return 'text-[#5a3e1a]';
    case 'dark':
      return 'text-[#e8e8e8]';
    default:
      return 'text-[#2c2c2c]';
  }
}

/** 经典原文未录入时的友好占位（不暴露任何技术提示） */
function ContentLoading({ isDark, isScroll }: { isDark: boolean; isScroll: boolean }): ReactNode {
  const textColor = isDark ? 'text-gray-400' : isScroll ? 'text-[#7a5a2a]' : 'text-gray-500';
  const ringColor = isDark ? 'border-purple-500/30 border-t-purple-300' : isScroll ? 'border-amber-700/40 border-t-amber-700' : 'border-amber-200 border-t-amber-600';
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${textColor}`}>
      <div className={`w-12 h-12 rounded-full border-4 ${ringColor} animate-spin mb-4`} />
      <p className="text-base tracking-widest" style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}>
        经典原文加载中
      </p>
      <p className="text-xs mt-2 opacity-60">此章节原文正在校录 · 敬请期待</p>
    </div>
  );
}

export default function ArticleDetailClient({ article, category }: ArticleDetailClientProps): ReactNode {
  const [mode, setMode] = useState<ReadingMode>('contrast');
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatPassage, setChatPassage] = useState<string>('');
  const userRole = useUserRole();

  const backHref = `/zang/library/${encodeURIComponent(category || article.source || '')}`;
  const backLabel = category ? `返回${category}` : article.source ? `返回${article.source}` : '返回藏经阁';

  const paragraphs = splitArticleToParagraphs(article.content);
  const { free: translationFree, premium: translationPremium } = splitTranslationForPaywall(article.translation || '');
  const commentaries = (article.commentaries ?? '').toString();
  const isPaid = userRole === 'member' || userRole === 'admin';

  const openChat = useCallback((passage: string) => {
    setChatPassage(passage);
    setChatOpen(true);
  }, []);
  const closeChat = useCallback(() => setChatOpen(false), []);

  const isScroll = mode === 'scroll';
  const isDark = mode === 'dark';

  return (
    <div className={containerClass(mode)}>
      <main className={`max-w-4xl mx-auto px-4 py-8`}>
        <Link
          href={backHref}
          className={`text-sm mb-4 inline-flex items-center gap-1 transition-colors ${
            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#2c2c2c]'
          }`}
        >
          <span>←</span>
          <span>{backLabel}</span>
        </Link>

        <article className={`rounded-2xl p-6 sm:p-10 ${cardClass(mode)}`}>
          {/* 头部 */}
          <div
            className={`mb-4 flex items-center gap-2 text-sm ${
              isDark ? 'text-amber-300' : 'text-amber-700'
            }`}
          >
            <span>📜</span>
            <span>{article.source || '典籍'}</span>
            {article.category && (
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                · {article.category}
              </span>
            )}
            <span
              className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${
                isDark
                  ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              原文免费
            </span>
          </div>

          <h1
            className={`text-3xl sm:text-4xl font-serif mb-6 ${titleClass(mode)}`}
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            {article.title}
          </h1>

          {/* 模式控制栏 */}
          <div className={isDark ? 'text-white' : ''}>
            <ReadingModeBar value={mode} onChange={setMode} />
          </div>

          {/* 主体内容 */}
          {mode === 'scroll' && (
            // 古卷：竖排大字段落 + 段落 AI 按钮
            <div className="space-y-6">
              {paragraphs.length > 0 ? (
                paragraphs.map((p, idx) => (
                  <div key={idx} className="space-y-2">
                    <p
                      className="leading-loose tracking-wider"
                      style={{
                        writingMode: 'vertical-rl',
                        fontSize: '1.5rem',
                        lineHeight: 2,
                        maxHeight: '60vh',
                        margin: '0 auto',
                        fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif",
                        color: '#3a2c1a',
                      }}
                    >
                      {p}
                    </p>
                    <button
                      type="button"
                      onClick={() => openChat(p)}
                      className="block text-xs px-3 py-1 rounded-full bg-[#b88a4a]/15 text-[#7a5a2a] hover:bg-[#b88a4a]/30 transition"
                    >
                      🧠 AI 参详
                    </button>
                  </div>
                ))
              ) : (
                <ContentLoading isDark={isDark} isScroll={isScroll} />
              )}
            </div>
          )}

          {(mode === 'contrast' || mode === 'dark') && (
            // 逐句对照 / 暗夜：移动端 & 平板上下滑屏对照，大屏 xl (≥1280) 才左右分栏
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* 原文栏 */}
              <div>
                <h3
                  className={`text-xs font-bold mb-3 tracking-widest ${
                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                  }`}
                >
                  📜 原文（免费）
                </h3>
                <div className="space-y-4">
                  {paragraphs.length > 0 ? (
                    paragraphs.map((p, idx) => (
                      <div key={idx}>
                        <p
                          className="leading-loose"
                          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
                        >
                          {p}
                        </p>
                        <button
                          type="button"
                          onClick={() => openChat(p)}
                          className={`mt-1 text-xs px-2.5 py-1 rounded-full transition ${
                            isDark
                              ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                          }`}
                        >
                          🧠 AI 参详
                        </button>
                      </div>
                    ))
                  ) : (
                    <ContentLoading isDark={isDark} isScroll={false} />
                  )}
                </div>
              </div>

              {/* 译文栏 */}
              <div>
                <h3
                  className={`text-xs font-bold mb-3 tracking-widest ${
                    isDark ? 'text-amber-400' : 'text-amber-600'
                  }`}
                >
                  🌐 白话（30% 免费 · 70% 会员）
                </h3>
                {translationFree ? (
                  <div className="leading-loose">
                    <p>{translationFree}</p>
                    {translationPremium && !isPaid && (
                      <div className="mt-4">
                        <ReportPaywall
                          userRole={userRole}
                          reportKey={`library-trans-${article.slug}`}
                          premiumSections={['后 70% 完整译文', '历代名家点评']}
                          freePart="（后续译文已隐藏，升级会员即可阅读全文）"
                          premiumPart={translationPremium}
                          accentClass={isDark ? 'text-amber-300' : 'text-amber-300'}
                        />
                      </div>
                    )}
                    {translationPremium && isPaid && (
                      <p className="mt-4 whitespace-pre-wrap">{translationPremium}</p>
                    )}
                  </div>
                ) : (
                  <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                    白话译文正在校录 · 敬请期待
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 字词注释 — 永远免费 */}
          {article.annotation && (
            <div className={`mt-8 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <h3
                className={`text-sm font-bold mb-2 ${
                  isDark ? 'text-amber-300' : 'text-[#b88a4a]'
                }`}
              >
                📝 字词注释
              </h3>
              <div
                className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                dangerouslySetInnerHTML={{ __html: article.annotation }}
              />
            </div>
          )}

          {/* 作者按语 — 永远免费 */}
          {article.author_note && (
            <div className="mt-6">
              <h3
                className={`text-sm font-bold mb-2 ${
                  isDark ? 'text-amber-300' : 'text-[#b88a4a]'
                }`}
              >
                ✒️ 作者按语
              </h3>
              <div
                className={`text-sm leading-relaxed italic ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
                dangerouslySetInnerHTML={{ __html: article.author_note }}
              />
            </div>
          )}

          {/* 历代名家点评 — 会员解锁 */}
          {commentaries && (
            <div className={`mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <h3
                className={`text-sm font-bold mb-2 flex items-center gap-2 ${
                  isDark ? 'text-amber-300' : 'text-[#b88a4a]'
                }`}
              >
                <span>📚 历代名家点评</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    isDark
                      ? 'bg-amber-900/40 text-amber-200 border border-amber-700/50'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  会员
                </span>
              </h3>
              {isPaid ? (
                <div
                  className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  dangerouslySetInnerHTML={{ __html: commentaries }}
                />
              ) : (
                <div className="mt-2">
                  <ReportPaywall
                    userRole={userRole}
                    reportKey={`library-cmt-${article.slug}`}
                    premiumSections={['历代名家点评']}
                    freePart="历代名家点评已隐藏，升级会员即可解锁。解锁后可见：憨山、德清、僧肇等历代高僧大德的精辟批注。"
                    premiumPart={commentaries}
                    accentClass={isDark ? 'text-amber-300' : 'text-amber-300'}
                  />
                </div>
              )}
            </div>
          )}
        </article>
      </main>

      {/* AI 参详抽屉 */}
      <AiChatDrawer
        open={chatOpen}
        onClose={closeChat}
        passage={chatPassage}
        articleTitle={article.title}
      />
    </div>
  );
}
