'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MiniMarkdown from './MiniMarkdown';
import useTTS from '@/hooks/useTTS';

interface ContentReaderProps {
  articleId: string;
  tenantId: string;
  initialArticle?: ArticleData;
}

interface ArticleData {
  id: string;
  title: string;
  content: string;
  author?: string;
  date?: string;
  categories?: string[];
  free_chapter_count?: number;
  price_per_chapter?: number;
  chapter_index?: number;
  is_paid?: boolean;
}

interface Topic {
  id: string;
  title: string;
  content: string;
  created_at: string;
  replies_count?: number;
}

export default function ContentReader({ articleId, tenantId, initialArticle }: ContentReaderProps) {
  const [article, setArticle] = useState<ArticleData | null>(initialArticle || null);
  const [loading, setLoading] = useState(!initialArticle);
  const [hasPaid, setHasPaid] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const { speak, stop, isSpeaking, isLoading: isTTSLoading } = useTTS();

  useEffect(() => {
    if (!initialArticle) {
      fetchArticle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, tenantId]);

  useEffect(() => {
    if (article) {
      checkAccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article, hasPaid]);

  useEffect(() => {
    fetchKoumiConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const fetchKoumiConfig = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) return;

      const res = await fetch(`${supabaseUrl}/rest/v1/tenants?slug=eq.${tenantId}`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const config = data[0].koumi_config || {};
        setVoiceId(config.voice_id || null);
      }
    } catch {
      setVoiceId(null);
    }
  };

  const handleSpeak = async () => {
    if (!article) return;
    const text = showPaywall ? article.content.slice(0, 500) : article.content;
    const cleanText = text.replace(/[#*`>\-\[\]]/g, '').trim();
    const params: Record<string, any> = { text: cleanText };
    if (voiceId) {
      params.voice = voiceId;
    }
    try {
      const r = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!r.ok) throw new Error('TTS 请求失败');
      const blob = await r.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
    } catch (e) {
      console.error('[TTS] speak failed:', e);
    }
  };

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${supabaseUrl}/rest/v1/muxintang_articles?id=eq.${articleId}&tenant_id=eq.${tenantId}`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setArticle({
          id: data[0].id,
          title: data[0].title,
          content: data[0].content || '',
          author: data[0].author,
          date: data[0].created_at,
          categories: data[0].categories ? JSON.parse(data[0].categories) : [],
          free_chapter_count: data[0].free_chapter_count || 0,
          price_per_chapter: data[0].price_per_chapter || 0,
          chapter_index: data[0].chapter_index || 0,
          is_paid: data[0].is_paid || false,
        });
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = () => {
    if (!article) return;

    const isFree = !article.is_paid || article.price_per_chapter === 0;
    const isFreeChapter = article.chapter_index && article.free_chapter_count &&
      article.chapter_index <= article.free_chapter_count;
    const isMember = typeof window !== 'undefined' && 
      localStorage.getItem('user_role') === 'member';

    if (isFree || isFreeChapter || isMember || hasPaid) {
      setShowPaywall(false);
    } else {
      setShowPaywall(true);
    }
  };

  const handlePurchase = () => {
    setHasPaid(true);
    setShowPaywall(false);
  };

  const fetchTopics = async () => {
    setDiscussionLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setDiscussionLoading(false);
        return;
      }

      const res = await fetch(`${supabaseUrl}/rest/v1/topics?article_id=eq.${articleId}&tenant_id=eq.${tenantId}&parent_topic_id=is.null`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      const data = await res.json();
      if (Array.isArray(data)) {
        setTopics(data.map((t: any) => ({
          id: t.id,
          title: t.title,
          content: t.content,
          created_at: t.created_at,
          replies_count: t.replies_count || 0,
        })));
      }
    } catch {
    } finally {
      setDiscussionLoading(false);
    }
  };

  const handleOpenDiscussion = async () => {
    setShowDiscussion(true);
    await fetchTopics();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-[#808080]">文章不存在</p>
      </div>
    );
  }

  const displayContent = showPaywall ? 
    article.content.slice(0, 500) + '\n\n...' : 
    article.content;

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {article.categories?.map((cat) => (
            <span 
              key={cat}
              className="text-xs text-[#D4AF37] bg-[#8B4513]/30 px-3 py-1 rounded-full"
            >
              {cat}
            </span>
          ))}
        </div>
        <h1 
          className="text-3xl font-bold mb-4"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
        >
          {article.title}
        </h1>
        <div className="flex items-center gap-4 text-[#808080]">
          <span>👤 {article.author || '佚名'}</span>
          <span>📅 {article.date ? new Date(article.date).toLocaleDateString() : ''}</span>
        </div>
      </div>

      <div className="muxintang-card p-8">
        <MiniMarkdown 
          text={displayContent} 
          className="text-[#C0C0C0] leading-relaxed" 
        />
      </div>

      {showPaywall && (
        <div className="mt-6 muxintang-card p-8 border-[#D4AF37]">
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 
              className="text-xl font-semibold mb-2"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              本章为付费内容
            </h3>
            <p className="text-[#808080] mb-6">
              本章价格：¥{article.price_per_chapter}，开通会员即可免费阅读全部内容
            </p>
            <button
              onClick={handlePurchase}
              className="bg-[#8B4513] text-[#D4AF37] px-8 py-3 rounded-lg hover:bg-[#A0522D] transition-colors"
            >
              立即购买 ¥{article.price_per_chapter}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button 
          onClick={() => window.history.back()}
          className="text-[#808080] hover:text-[#D4AF37] transition-colors"
        >
          ← 返回列表
        </button>
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-[#808080] hover:text-[#D4AF37] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            收藏
          </button>
          <button 
            onClick={handleOpenDiscussion}
            className="flex items-center gap-2 text-[#808080] hover:text-[#D4AF37] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            讨论本章
          </button>
        </div>
      </div>

      {showDiscussion && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowDiscussion(false)}>
          <div 
            className="bg-[#1a1a1a] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-[#333]">
              <h3 
                className="text-xl font-semibold"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
              >
                💬 本章讨论
              </h3>
              <button 
                onClick={() => setShowDiscussion(false)}
                className="text-[#808080] hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {discussionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : topics.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#808080]">暂无讨论，快来发表你的见解吧！</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topics.map((topic) => (
                    <div key={topic.id} className="bg-[#242424] rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">{topic.title}</h4>
                      <p className="text-[#808080] text-sm mb-2">{topic.content}</p>
                      <div className="flex items-center justify-between text-xs text-[#666]">
                        <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                        <span>💬 {topic.replies_count} 回复</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSpeak}
        disabled={isTTSLoading}
        className="fixed bottom-8 left-8 bg-[#1a1a1a] text-[#D4AF37] border border-[#D4AF37]/30 px-5 py-3 rounded-full shadow-lg hover:bg-[#2a2a2a] hover:border-[#D4AF37]/50 transition-all flex items-center gap-2 z-40"
      >
        <span>🔊</span>
        <span className="text-sm font-medium">听阿阇梨诵读</span>
      </button>

      <Link
        href={`/tong/community?article_id=${articleId}&article_title=${encodeURIComponent(article.title)}`}
        className="fixed bottom-8 right-8 bg-[#8B4513] text-[#D4AF37] px-6 py-3 rounded-full shadow-lg hover:bg-[#A0522D] hover:shadow-xl transition-all flex items-center gap-2 z-40"
      >
        <span>💬</span>
        <span className="text-sm font-medium">与同修们讨论这篇文章</span>
      </Link>
    </>
  );
}
