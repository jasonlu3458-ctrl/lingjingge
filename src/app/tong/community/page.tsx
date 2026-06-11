'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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

interface DisplayPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  tag: string;
  isPinned: boolean;
  isDaily: boolean;
  isWeekly: boolean;
  isGuide: boolean;
  createdAt: string;
  // 统计字段
  replies: number;
  likes: number;
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

function mapToDisplayPost(row: TopicRow, childCount: number): DisplayPost {
  return {
    id: row.id,
    title: row.title,
    excerpt: (row.content || '').slice(0, 100) + ((row.content || '').length > 100 ? '…' : ''),
    author: authorOf(row),
    tag: row.tag || '心得',
    isPinned: !!row.is_pinned,
    isDaily: !!row.is_daily,
    isWeekly: !!row.is_weekly,
    isGuide: !!row.is_guide,
    createdAt: relTime(row.created_at),
    replies: childCount,
    likes: 0,
  };
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'latest' | 'essence' | 'topics'>('latest');
  const [activeTag, setActiveTag] = useState('全部');
  const [dailyPost, setDailyPost] = useState<DisplayPost | null>(null);
  const [weeklyPost, setWeeklyPost] = useState<DisplayPost | null>(null);
  const [guidePost, setGuidePost] = useState<DisplayPost | null>(null);
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setError('Supabase 未配置，正在显示示例数据。');
      setLoading(false);
      return;
    }

    try {
      // 1) 拉所有主帖（parent_topic_id is null）
      const { data: rows, error: qErr } = await supabase
        .from('topics')
        .select('id,user_id,title,content,tag,is_pinned,is_daily,is_weekly,is_guide,parent_topic_id,is_ai_reply,created_at')
        .is('parent_topic_id', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(60);
      if (qErr) throw new Error(qErr.message);
      if (!rows) {
        setLoading(false);
        return;
      }

      // 2) 拉每条主帖的回帖数
      const ids = rows.map((r: TopicRow) => r.id);
      let childCountMap = new Map<number, number>();
      if (ids.length > 0) {
        const { data: children, error: cErr } = await supabase
          .from('topics')
          .select('id,parent_topic_id')
          .in('parent_topic_id', ids);
        if (!cErr && children) {
          for (const c of children as Array<{ id: number; parent_topic_id: number | null }>) {
            if (c.parent_topic_id != null) {
              childCountMap.set(c.parent_topic_id, (childCountMap.get(c.parent_topic_id) || 0) + 1);
            }
          }
        }
      }

      // 3) 分类
      let daily: DisplayPost | null = null;
      let weekly: DisplayPost | null = null;
      let guide: DisplayPost | null = null;
      const normal: DisplayPost[] = [];

      for (const row of rows as TopicRow[]) {
        const dp = mapToDisplayPost(row, childCountMap.get(row.id) || 0);
        // 优先取最新一条
        if (row.is_daily && !daily) daily = dp;
        else if (row.is_weekly && !weekly) weekly = dp;
        else if (row.is_guide && !guide) guide = dp;
        else normal.push(dp);
      }

      setDailyPost(daily);
      setWeeklyPost(weekly);
      setGuidePost(guide);
      setPosts(normal);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPosts = activeTag === '全部'
    ? posts
    : posts.filter(post => post.tag === activeTag);

  // 动态从 posts 提取 tag 集合 + 计数
  const tagCounts = posts.reduce<Record<string, number>>((acc, p) => {
    if (p.tag) acc[p.tag] = (acc[p.tag] || 0) + 1;
    return acc;
  }, {});
  const tagList = ['全部', ...Object.keys(tagCounts)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif text-gray-800" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}>
              同修社区
            </h1>
            <p className="text-gray-500 text-sm mt-1">与同修一起探索心灵成长之路</p>
          </div>
          <Link
            href="/tong/community/new"
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            + 发布新帖
          </Link>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            ⚠️ {error}
          </div>
        )}

        {/* 置顶帖：每日参究 */}
        {dailyPost && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 shadow-sm border border-purple-200 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full font-medium">📌 置顶</span>
              <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full font-medium">☀️ 每日参究</span>
            </div>
            <Link href={`/tong/community/${dailyPost.id}`} className="block group">
              <h3 className="text-lg font-medium text-purple-800 mb-2 group-hover:text-purple-600 transition-colors" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                {dailyPost.title}
              </h3>
              <p className="text-sm text-purple-600 line-clamp-2">{dailyPost.excerpt}</p>
            </Link>
          </div>
        )}

        {/* 置顶帖：每周话题 */}
        {weeklyPost && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 shadow-sm border border-emerald-200 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full font-medium">📌 置顶</span>
              <span className="text-xs bg-teal-500 text-white px-2 py-1 rounded-full font-medium">📅 每周话题</span>
            </div>
            <Link href={`/tong/community/${weeklyPost.id}`} className="block group">
              <h3 className="text-lg font-medium text-emerald-800 mb-2 group-hover:text-emerald-600 transition-colors" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                {weeklyPost.title}
              </h3>
              <p className="text-sm text-emerald-600 line-clamp-2">{weeklyPost.excerpt}</p>
            </Link>
          </div>
        )}

        {/* 置顶帖：新手必读 */}
        {guidePost && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 shadow-sm border border-amber-300 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded-full font-medium">📌 置顶</span>
              <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-medium">📜 新手必读</span>
            </div>
            <Link href={`/tong/community/${guidePost.id}`} className="block group">
              <h3 className="text-lg font-medium text-amber-800 mb-2 group-hover:text-amber-600 transition-colors" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                {guidePost.title}
              </h3>
              <p className="text-sm text-amber-700 line-clamp-2">{guidePost.excerpt}</p>
            </Link>
          </div>
        )}

        {/* 三块置顶都空时的提示 */}
        {!dailyPost && !weeklyPost && !guidePost && !loading && (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 mb-6 text-center text-sm text-gray-500">
            <p className="mb-2">📭 社区暂无置顶内容</p>
            <p>管理员可访问 <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">POST /api/community/seed</code> 一次性植入</p>
          </div>
        )}

        {/* 标签切换栏 */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm mb-6">
          <button
            onClick={() => setActiveTab('latest')}
            className={`flex-1 py-3 px-6 rounded-lg transition-all ${
              activeTab === 'latest'
                ? 'bg-gray-800 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            📝 最新
          </button>
          <button
            onClick={() => setActiveTab('essence')}
            className={`flex-1 py-3 px-6 rounded-lg transition-all ${
              activeTab === 'essence'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            💎 精华
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`flex-1 py-3 px-6 rounded-lg transition-all ${
              activeTab === 'topics'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            🪷 话题
          </button>
        </div>

        {/* 内容区 */}
        <div className="space-y-4">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                  <div className="h-5 bg-gray-100 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-full"></div>
                </div>
              ))}
            </div>
          )}

          {!loading && activeTab === 'latest' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {tagList.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                      activeTag === tag
                        ? 'bg-[#2c2c2c] text-white'
                        : 'bg-white text-[#2c2c2c] border border-gray-200'
                    }`}
                  >
                    {tag === '全部' ? '全部' : `${tag} (${tagCounts[tag]})`}
                  </button>
                ))}
              </div>

              {filteredPosts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-4">📭</div>
                  <p>
                    {activeTag === '全部'
                      ? '暂无新帖，欢迎成为第一个发帖的同修'
                      : `暂无「${activeTag}」分类的帖子`}
                  </p>
                  <Link href="/tong/community/new" className="inline-block mt-4 text-emerald-600 hover:underline">
                    发布新帖 →
                  </Link>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/tong/community/${post.id}`}
                    className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full font-medium">
                        {post.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3 hover:text-gray-600 transition-colors"
                        style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>👤 {post.author}</span>
                      <span>🕐 {post.createdAt}</span>
                      <span>💬 {post.replies} 回复</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {!loading && activeTab === 'essence' && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-4">💎</div>
              <p>精华帖评选中</p>
              <p className="text-xs mt-2">由社区积分 + 同修推荐综合评定</p>
            </div>
          )}

          {!loading && activeTab === 'topics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'daily', title: '#每日参究#', count: posts.length, description: '每日禅机与同修分享' },
                { id: 'weekly', title: '#每周话题#', count: 1, description: '本周共同关注的话题' },
                { id: 'guide', title: '#社区指南#', count: 1, description: '发帖规则与精华评选' },
                { id: 'help', title: '#求助·共修#', count: posts.filter(p => p.tag === '求助').length, description: '遇到困惑时来此求助' },
                { id: 'experience', title: '#心得·体悟#', count: posts.filter(p => p.tag === '心得').length, description: '修行中的真实心得' },
                { id: 'share', title: '#分享·推荐#', count: posts.filter(p => p.tag === '分享').length, description: '推荐好书、好文、好方法' },
              ].map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border border-emerald-100"
                >
                  <h3 className="text-lg font-medium text-emerald-800 mb-2"
                      style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                    {t.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{t.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {t.count} 篇讨论
                    </span>
                    <span className="text-xs text-gray-400">进入 →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
