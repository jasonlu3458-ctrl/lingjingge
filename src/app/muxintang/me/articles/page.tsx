'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';

type Article = {
  id: string;
  type: string;
  category: string;
  title: string;
  content: string;
  summary: string;
  status: string;
  word_count: number;
  created_at: string;
  updated_at: string;
};

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  article: { label: '文章', icon: '📝' },
  novel: { label: '小说', icon: '📖' },
  poem: { label: '诗词', icon: '🪷' },
  essay: { label: '散文', icon: '🖋️' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'text-[#808080]' },
  published: { label: '已发布', color: 'text-green-400' },
  archived: { label: '已归档', color: 'text-[#D4AF37]' },
};

export default function MyArticlesPage() {
  const isAuthenticated = useIsAuthenticated();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/muxintang/articles');
      const data = await res.json();
      setArticles(data.articles || []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) return;
    try {
      await fetch(`/api/muxintang/articles/${id}`, { method: 'DELETE' });
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/muxintang/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
      }
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const filteredArticles = articles.filter((a) => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: articles.length,
    published: articles.filter((a) => a.status === 'published').length,
    drafts: articles.filter((a) => a.status === 'draft').length,
    totalWords: articles.reduce((sum, a) => sum + (a.word_count || 0), 0),
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            请先登录
          </h1>
          <p className="text-[#808080] mb-6">登录后即可管理您的创作</p>
          <Link
            href="/muxintang/login"
            className="inline-block px-6 py-3 bg-[#D4AF37] text-black rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            前往登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              ✍️ 我的创作
            </h1>
            <p className="text-[#808080]">书写心之所向，牧之以道</p>
          </div>
          <Link
            href="/muxintang/me/write"
            className="px-6 py-3 bg-[#D4AF37] text-black rounded-xl font-semibold hover:opacity-90 transition-all"
          >
            + 开始创作
          </Link>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="muxintang-card p-4 text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{stats.total}</p>
            <p className="text-xs text-[#808080] mt-1">全部作品</p>
          </div>
          <div className="muxintang-card p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.published}</p>
            <p className="text-xs text-[#808080] mt-1">已发布</p>
          </div>
          <div className="muxintang-card p-4 text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{stats.drafts}</p>
            <p className="text-xs text-[#808080] mt-1">草稿</p>
          </div>
          <div className="muxintang-card p-4 text-center">
            <p className="text-2xl font-bold text-[#C0C0C0]">{stats.totalWords.toLocaleString()}</p>
            <p className="text-xs text-[#808080] mt-1">总字数</p>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="muxintang-card p-4 mb-6 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索作品..."
            className="flex-1 min-w-[200px] bg-[#1A1A1A] border border-[#333333] rounded-lg px-3 py-2 text-white placeholder:text-zinc-600 focus:border-[#D4AF37] focus:outline-none"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#1A1A1A] border border-[#333333] rounded-lg px-3 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="all">全部类型</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l.icon} {l.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#1A1A1A] border border-[#333333] rounded-lg px-3 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="all">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* 文章列表 */}
        {loading ? (
          <div className="text-center py-12 text-[#808080]">加载中...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="muxintang-card p-12 text-center">
            <div className="text-6xl mb-4">📜</div>
            <h3 className="text-xl text-white mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              尚无作品
            </h3>
            <p className="text-[#808080] mb-6">开始您的第一篇创作吧</p>
            <Link
              href="/muxintang/me/write"
              className="inline-block px-6 py-3 bg-[#8B4513] text-[#D4AF37] rounded-xl hover:bg-[#A0522D] transition-colors"
            >
              ✦ 开始书写
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article) => {
              const typeInfo = TYPE_LABELS[article.type] || { label: article.type, icon: '📄' };
              const statusInfo = STATUS_LABELS[article.status] || { label: article.status, color: 'text-[#808080]' };
              return (
                <div
                  key={article.id}
                  className="muxintang-card p-4 flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{typeInfo.icon}</span>
                      <span className="text-xs text-[#808080] bg-[#242424] px-2 py-0.5 rounded">
                        {typeInfo.label}
                      </span>
                      <span className={`text-xs ${statusInfo.color}`}>
                        ● {statusInfo.label}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold truncate mb-1">{article.title}</h3>
                    <p className="text-sm text-[#808080] line-clamp-2">
                      {article.summary || article.content?.slice(0, 100) || '暂无内容'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#555555]">
                      <span>{article.word_count} 字</span>
                      <span>更新于 {new Date(article.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-2 shrink-0">
                    <Link
                      href={`/muxintang/me/write/${article.id}`}
                      className="px-3 py-1.5 text-sm border border-[#D4AF37]/50 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/10 transition-all text-center"
                    >
                      编辑
                    </Link>
                    {article.status === 'draft' ? (
                      <button
                        onClick={() => handleStatusChange(article.id, 'published')}
                        className="px-3 py-1.5 text-sm bg-[#8B4513] text-[#D4AF37] rounded-lg hover:bg-[#A0522D] transition-colors"
                      >
                        发布
                      </button>
                    ) : article.status === 'published' ? (
                      <button
                        onClick={() => handleStatusChange(article.id, 'draft')}
                        className="px-3 py-1.5 text-sm border border-[#808080] text-[#808080] rounded-lg hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
                      >
                        转为草稿
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="px-3 py-1.5 text-sm border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                    >
                      删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
