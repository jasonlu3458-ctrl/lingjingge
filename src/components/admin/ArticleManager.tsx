'use client';

import { useState, useEffect } from 'react';

interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  source: string | null;
  category: 'classics' | 'treasure' | 'essay' | null;
  created_at: string;
}

export default function ArticleManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Article | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/articles');
    const data = await res.json();
    setArticles(data.articles || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除这篇文章吗？')) {
      const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchArticles();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const articleData = {
      slug: formData.get('slug') as string,
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      source: formData.get('source') as string || null,
      category: formData.get('category') as 'classics' | 'treasure' | 'essay' | null,
    };

    if (editing) {
      await fetch(`/api/admin/articles/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });
    } else {
      await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });
    }

    setShowForm(false);
    setEditing(null);
    fetchArticles();
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          📝 密法灵学文章管理
        </h2>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="muxintang-btn px-4 py-2 text-sm"
        >
          + 新增文章
        </button>
      </div>

      {showForm && (
        <div className="bg-[#242424] rounded-lg p-4 mb-6">
          <h3 className="text-sm text-[#C0C0C0] mb-4">{editing ? '编辑文章' : '新增文章'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="slug"
                defaultValue={editing?.slug}
                placeholder="文章别名（slug）"
                className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
                required
              />
              <select
                name="category"
                defaultValue={editing?.category || ''}
                className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="">选择分类</option>
                <option value="classics">经典</option>
                <option value="treasure">宝藏</option>
                <option value="essay">随笔</option>
              </select>
            </div>
            <input
              type="text"
              name="title"
              defaultValue={editing?.title}
              placeholder="文章标题"
              className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none w-full"
              required
            />
            <textarea
              name="content"
              defaultValue={editing?.content}
              placeholder="文章内容"
              rows={4}
              className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none w-full resize-none"
              required
            />
            <input
              type="text"
              name="source"
              defaultValue={editing?.source || ''}
              placeholder="来源（可选）"
              className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none w-full"
            />
            <div className="flex gap-2">
              <button type="submit" className="muxintang-btn px-4 py-2 text-sm">
                保存
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="px-4 py-2 text-sm text-[#808080] hover:text-[#C0C0C0] border border-[#333333] rounded-lg"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-[#808080]">加载中...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#333333]">
                <th className="text-left py-3 px-4 text-sm text-[#808080]">标题</th>
                <th className="text-left py-3 px-4 text-sm text-[#808080]">分类</th>
                <th className="text-left py-3 px-4 text-sm text-[#808080]">来源</th>
                <th className="text-left py-3 px-4 text-sm text-[#808080]">创建时间</th>
                <th className="text-right py-3 px-4 text-sm text-[#808080]">操作</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-b border-[#333333]">
                  <td className="py-3 px-4 text-[#C0C0C0]">{article.title}</td>
                  <td className="py-3 px-4 text-[#808080]">
                    {article.category === 'classics' ? '经典' : article.category === 'treasure' ? '宝藏' : article.category === 'essay' ? '随笔' : '-'}
                  </td>
                  <td className="py-3 px-4 text-[#808080]">{article.source || '-'}</td>
                  <td className="py-3 px-4 text-[#808080] text-sm">{new Date(article.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditing(article);
                          setShowForm(true);
                        }}
                        className="text-sm text-[#D4AF37] hover:text-[#F0D77E]"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        删除
                      </button>
                    </div>
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