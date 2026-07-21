'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface TopicRow {
  id: number;
  user_id: string | null;
  title: string;
  content: string;
  tag: string | null;
  is_pinned: boolean | null;
  is_daily: boolean | null;
  is_weekly: boolean | null;
  is_guide: boolean | null;
  parent_topic_id: number | null;
  is_ai_reply: boolean | null;
  created_at: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  tag: string;
  replies: number;
  likes: number;
  time: string;
  isEssence?: boolean;
  isDaily?: boolean;
  isWeekly?: boolean;
  isGuide?: boolean;
  isAiReply?: boolean;
}

interface RecommendedPost {
  id: number;
  title: string;
  author: string;
  tag: string;
  similarity: string;
}

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

function authorOf(row: TopicRow): string {
  if (!row.user_id || row.user_id === SYSTEM_USER_ID) {
    if (row.is_ai_reply) return '🤖 同修助手';
    if (row.is_daily) return '☀️ 每日参究';
    if (row.is_weekly) return '📅 本周话题';
    if (row.is_guide) return '📜 新手必读';
    return '系统';
  }
  return '同修';
}

function rowToPost(row: TopicRow, childCount: number): Post {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    author: authorOf(row),
    tag: row.tag || '心得',
    replies: childCount,
    likes: 0,
    time: relTime(row.created_at),
    isDaily: !!row.is_daily,
    isWeekly: !!row.is_weekly,
    isGuide: !!row.is_guide,
    isAiReply: !!row.is_ai_reply,
  };
}

// 兜底数据
const mockPosts: Record<string, Post> = {
  '1': {
    id: 1, title: '今日参悟：什么是真正的放下？', tag: '心得', replies: 12, likes: 34, time: '2小时前',
    author: '云游',
    content: `今天在禅修中，我突然想到了一个问题：什么是真正的放下？

很多人说放下，但真正做到的又有几个？我们总是被过去的记忆、未来的担忧所困扰。

我想，真正的放下，不是逃避，不是遗忘，而是面对。面对自己的内心，面对那些让我们痛苦的事情，然后选择不再被它们束缚。

正如《金刚经》所说："凡所有相，皆是虚妄。"当我们真正理解了这一点，放下就不再是一种挣扎，而是一种自然的释放。

愿与同修们共勉。`,
  },
};

async function getRecommendedPosts(content: string): Promise<RecommendedPost[]> {
  try {
    const response = await fetch('/api/dify/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'knowledge',
        content: `请根据以下帖子内容，推荐3个相关的话题或关键词：${content.slice(0, 200)}`
      })
    });
    const data = await response.json();
    return [
      { id: 101, title: '禅修入门指南', author: '静心', tag: '分享', similarity: '高度相关' },
      { id: 102, title: '正念呼吸法详解', author: '云游', tag: '心得', similarity: '相关' },
      { id: 103, title: '如何面对内心的恐惧', author: '行者', tag: '求助', similarity: '相关' },
    ];
  } catch (error) {
    return [];
  }
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [recommendedPosts, setRecommendedPosts] = useState<RecommendedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      // 尝试从 Supabase 拉
      if (isSupabaseConfigured()) {
        try {
          // 主帖（topics.id 是 number，URL param 是 string，转换）
          const numericPostId = Number(postId);
          if (Number.isNaN(numericPostId)) {
            setError('无效的帖子 ID');
            setLoading(false);
            return;
          }
          const { data: row, error: qErr } = await supabase
            .from('topics')
            .select('*')
            .eq('id', numericPostId)
            .maybeSingle<TopicRow>();

          if (qErr) {
            setError(`查询失败：${qErr.message}`);
          } else if (row) {
            // 回帖列表（parent_topic_id 也是 number，复用 numericPostId）
            const { data: childRows } = await supabase
              .from('topics')
              .select('*')
              .eq('parent_topic_id', numericPostId)
              .order('created_at', { ascending: true });

            setPost(rowToPost(row, (childRows || []).length));
            setReplies((childRows || []).map((r: TopicRow) => rowToPost(r, 0)));
            const recs = await getRecommendedPosts(row.content);
            setRecommendedPosts(recs);
            setLoading(false);
            return;
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : '加载失败');
        }
      }

      // 兜底：mockPosts
      const fallback = mockPosts[postId];
      if (fallback) {
        setPost(fallback);
        setReplies([]);
      } else {
        setPost(null);
      }
      setLoading(false);
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-100 rounded mb-2"></div>
            <div className="h-4 bg-gray-100 rounded mb-2"></div>
            <div className="h-4 bg-gray-100 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl text-gray-600 mb-4">帖子不存在</h1>
            <Link href="/tong/community" className="text-emerald-600 hover:underline">
              返回社区
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/tong/community"
          className="inline-block mb-6 text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← 返回同修社区
        </Link>

        {error && (
          <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
            ⚠️ {error}
          </div>
        )}

        {/* 帖子详情 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {post.isDaily && <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full font-medium">☀️ 每日参究</span>}
            {post.isWeekly && <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full font-medium">📅 每周话题</span>}
            {post.isGuide && <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded-full font-medium">📜 新手必读</span>}
            <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full font-medium">{post.tag}</span>
            <span className="text-sm text-gray-500">👤 {post.author}</span>
            <span className="text-sm text-gray-500">🕐 {post.time}</span>
          </div>

          <h1
            className="text-2xl font-bold text-gray-800 mb-6"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            {post.title}
          </h1>

          <div
            className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            {post.content}
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
              <span>❤️</span>
              <span>{post.likes} 喜欢</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-emerald-500 transition-colors">
              <span>💬</span>
              <span>{post.replies} 回复</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-amber-500 transition-colors">
              <span>🔗</span>
              <span>分享</span>
            </button>
          </div>
        </div>

        {/* 回复区域 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2
            className="text-xl font-bold text-gray-800 mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            💬 回复（{replies.length}）
          </h2>

          {replies.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-lg">
              暂无回复。快来成为第一个回应的同修 ✨
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {replies.map((r) => (
                <div
                  key={r.id}
                  className={`p-4 rounded-lg border ${
                    r.isAiReply
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-700 font-medium">{r.author}</span>
                    {r.isAiReply && (
                      <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                        AI
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">{r.time}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {r.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <textarea
            placeholder="写下你的回复..."
            className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 resize-none"
            rows={4}
            disabled
          />
          <p className="text-xs text-gray-400 mt-2 mb-3">
            ℹ️ 真实回帖功能将在下一版开放。当前 AI 同修助手会在新帖发布后自动回复一条。
          </p>
          <button
            className="px-6 py-2 bg-gray-300 text-white rounded-lg cursor-not-allowed"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            disabled
          >
            发布回复（即将开放）
          </button>
        </div>

        {/* 推荐帖子 */}
        {recommendedPosts.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2
              className="text-xl font-bold text-gray-800 mb-4"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            >
              📚 相关推荐
            </h2>
            <div className="space-y-3">
              {recommendedPosts.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/tong/community/${rec.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                          {rec.tag}
                        </span>
                        <span className="text-xs text-gray-400">{rec.similarity}</span>
                      </div>
                      <h3
                        className="text-gray-800"
                        style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                      >
                        {rec.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">👤 {rec.author}</p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
