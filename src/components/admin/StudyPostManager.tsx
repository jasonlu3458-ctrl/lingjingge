'use client';

import { useState, useEffect } from 'react';

interface StudyPost {
  id: number;
  title: string;
  content: string;
  tag: string | null;
  is_pinned: boolean | null;
  is_daily: boolean | null;
  is_weekly: boolean | null;
  is_guide: boolean | null;
  created_at: string;
}

export default function StudyPostManager() {
  const [posts, setPosts] = useState<StudyPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/study-posts');
    const data = await res.json();
    setPosts(data.posts || []);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定删除这篇帖子吗？')) {
      const res = await fetch(`/api/admin/study-posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPosts();
      }
    }
  };

  const handleTogglePin = async (id: number, isPinned: boolean | null) => {
    const res = await fetch(`/api/admin/study-posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !isPinned }),
    });
    if (res.ok) {
      fetchPosts();
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
      <h2 className="text-xl font-semibold text-[#D4AF37] mb-6" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
        📚 研学帖子管理
      </h2>

      {loading ? (
        <div className="text-center py-8 text-[#808080]">加载中...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#333333]">
                <th className="text-left py-3 px-4 text-sm text-[#808080]">标题</th>
                <th className="text-left py-3 px-4 text-sm text-[#808080]">标签</th>
                <th className="text-left py-3 px-4 text-sm text-[#808080]">加精</th>
                <th className="text-left py-3 px-4 text-sm text-[#808080]">类型</th>
                <th className="text-left py-3 px-4 text-sm text-[#808080]">创建时间</th>
                <th className="text-right py-3 px-4 text-sm text-[#808080]">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-[#333333]">
                  <td className="py-3 px-4 text-[#C0C0C0]">{post.title}</td>
                  <td className="py-3 px-4 text-[#808080]">{post.tag || '-'}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleTogglePin(post.id, post.is_pinned)}
                      className={`px-3 py-1 rounded text-xs ${
                        post.is_pinned
                          ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                          : 'bg-[#242424] text-[#808080] hover:text-[#C0C0C0]'
                      }`}
                    >
                      {post.is_pinned ? '★ 已加精' : '☆ 加精'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-[#808080]">
                    {post.is_daily && '📅 每日'}
                    {post.is_weekly && '📆 每周'}
                    {post.is_guide && '📖 指南'}
                    {!post.is_daily && !post.is_weekly && !post.is_guide && '-'}
                  </td>
                  <td className="py-3 px-4 text-[#808080] text-sm">{new Date(post.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}