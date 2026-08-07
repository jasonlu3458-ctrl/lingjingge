'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';

type ArticleType = 'article' | 'novel' | 'poem' | 'essay';
type ArticleStatus = 'draft' | 'published';

const TYPE_OPTIONS: { value: ArticleType; label: string; icon: string; desc: string }[] = [
  { value: 'article', label: '文章', icon: '📝', desc: '短小精悍的心得随笔' },
  { value: 'novel', label: '小说', icon: '📖', desc: '长篇故事、人物、剧情' },
  { value: 'poem', label: '诗词', icon: '🪷', desc: '古典诗词、现代诗歌' },
  { value: 'essay', label: '散文', icon: '🖋️', desc: '修行感悟、人生随笔' },
];

const CATEGORY_OPTIONS = [
  { value: 'life', label: '生活随笔' },
  { value: 'cultivation', label: '修行心得' },
  { value: 'scripture', label: '经文阐释' },
  { value: 'story', label: '行者故事' },
  { value: 'dream', label: '梦境感悟' },
  { value: 'other', label: '其他' },
];

export default function WritePage() {
  const router = useRouter();
  const params = useParams();
  const isAuthenticated = useIsAuthenticated();
  const articleId = params.id as string | undefined;
  const isEdit = !!articleId;

  const [type, setType] = useState<ArticleType>('article');
  const [category, setCategory] = useState('life');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // 加载已有文章（编辑模式）
  useEffect(() => {
    if (!isEdit) {
      setFetching(false);
      return;
    }
    const loadArticle = async () => {
      try {
        const res = await fetch(`/api/muxintang/articles/${articleId}`);
        const data = await res.json();
        if (data.article) {
          const a = data.article;
          setType(a.type || 'article');
          setCategory(a.category || 'life');
          setTitle(a.title || '');
          setContent(a.content || '');
          setSummary(a.summary || '');
          setCoverImage(a.cover_image || '');
        }
      } catch {
        setMessage({ type: 'error', text: '加载文章失败' });
      } finally {
        setFetching(false);
      }
    };
    loadArticle();
  }, [isEdit, articleId]);

  // 自动保存
  useEffect(() => {
    if (!title || fetching) return;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => {
      handleSave('draft', true);
    }, 30000); // 30秒自动保存
    setAutoSaveTimer(timer);
    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  const wordCount = content.length;

  const handleSave = async (status: ArticleStatus, isAuto = false) => {
    if (!title.trim()) {
      if (!isAuto) setMessage({ type: 'error', text: '请输入文章标题' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type,
        category,
        title: title.trim(),
        content,
        summary,
        cover_image: coverImage || null,
        status,
      };

      if (isEdit) {
        await fetch(`/api/muxintang/articles/${articleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch('/api/muxintang/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.article) {
          router.replace(`/muxintang/me/write/${data.article.id}`);
        }
      }

      const now = new Date().toLocaleTimeString();
      setLastSaved(now);
      if (!isAuto) {
        setMessage({ type: 'success', text: status === 'published' ? '发布成功！' : '保存成功' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err: any) {
      if (!isAuto) setMessage({ type: 'error', text: err.message || '保存失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) return;

    setLoading(true);
    try {
      await fetch(`/api/muxintang/articles/${articleId}`, { method: 'DELETE' });
      router.push('/muxintang/me/articles');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '删除失败' });
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            请先登录
          </h1>
          <p className="text-[#808080] mb-6">登录后即可开始您的创作之旅</p>
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

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 顶部操作栏 */}
        <div className="sticky top-16 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#333333] py-3 px-4 -mx-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/muxintang/me/articles"
              className="text-[#808080] hover:text-white text-sm"
            >
              ← 返回我的文章
            </Link>
            {lastSaved && (
              <span className="text-xs text-green-400">✓ 已于 {lastSaved} 自动保存</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#808080] mr-2">{wordCount} 字</span>
            <button
              onClick={() => handleSave('draft')}
              disabled={loading}
              className="px-4 py-2 text-sm border border-[#D4AF37]/50 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/10 transition-all disabled:opacity-50"
            >
              保存草稿
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={loading}
              className="px-4 py-2 text-sm bg-[#D4AF37] text-black rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? '处理中...' : '发布'}
            </button>
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-50"
              >
                删除
              </button>
            )}
          </div>
        </div>

        {/* 消息提示 */}
        {message && (
          <div
            className={`p-3 rounded-lg mb-4 text-center ${
              message.type === 'success'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 类型选择 */}
        <div className="muxintang-card p-4 mb-4">
          <p className="text-sm text-[#808080] mb-3">选择创作类型</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  type === opt.value
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-[#333333] bg-[#1A1A1A] hover:border-[#D4AF37]/50'
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <p className="text-white font-medium text-sm mt-1">{opt.label}</p>
                <p className="text-xs text-[#808080] mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 标题 */}
        <div className="muxintang-card p-4 mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入标题..."
            maxLength={100}
            className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-zinc-600 focus:outline-none"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          />
        </div>

        {/* 分类和封面 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="muxintang-card p-4">
            <label className="text-sm text-[#808080] block mb-2">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg px-3 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="muxintang-card p-4">
            <label className="text-sm text-[#808080] block mb-2">封面图片URL（可选）</label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg px-3 py-2 text-white placeholder:text-zinc-600 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        {/* 摘要 */}
        <div className="muxintang-card p-4 mb-4">
          <label className="text-sm text-[#808080] block mb-2">摘要（可选）</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="一句话描述这篇文章的核心内容..."
            rows={2}
            maxLength={200}
            className="w-full bg-transparent text-white placeholder:text-zinc-600 focus:outline-none resize-none"
          />
        </div>

        {/* 正文 */}
        <div className="muxintang-card p-4">
          <label className="text-sm text-[#808080] block mb-2">正文内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="开始书写您的感悟、故事、诗词..."
            rows={16}
            className="w-full bg-transparent text-white placeholder:text-zinc-600 focus:outline-none resize-y text-base leading-relaxed"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-[#808080]">建议至少 200 字</span>
            <span className="text-xs text-[#D4AF37]">{wordCount} 字</span>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="mt-6 text-center text-xs text-[#555555]">
          <p>✦ 每 30 秒自动保存草稿 · 数据安全存于云端 ✦</p>
        </div>
      </div>
    </div>
  );
}
