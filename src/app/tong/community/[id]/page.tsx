'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
}

interface RecommendedPost {
  id: number;
  title: string;
  author: string;
  tag: string;
  similarity: string;
}

// 模拟帖子数据
const mockPosts: Record<string, Post> = {
  '1': {
    id: 1,
    title: '今日参悟：什么是真正的放下？',
    content: `今天在禅修中，我突然想到了一个问题：什么是真正的放下？

很多人说放下，但真正做到的又有几个？我们总是被过去的记忆、未来的担忧所困扰。

我想，真正的放下，不是逃避，不是遗忘，而是面对。面对自己的内心，面对那些让我们痛苦的事情，然后选择不再被它们束缚。

正如《金刚经》所说："凡所有相，皆是虚妄"。当我们真正理解了这一点，放下就不再是一种挣扎，而是一种自然的释放。

愿与同修们共勉。`,
    author: '云游',
    tag: '心得',
    replies: 12,
    likes: 34,
    time: '2小时前'
  },
  '2': {
    id: 2,
    title: '我观易经：乾卦的启示',
    content: `乾卦，六爻皆阳，象征天、象征刚健。

《易经》云："天行健，君子以自强不息。"这句话，我读了无数遍，每次都有新的感悟。

乾卦告诉我们，做人要有刚健的品格，要有自强不息的精神。但同时，乾卦也提醒我们，刚健不是固执，自强不是逞强。

初九："潜龙勿用。"时机未到，要懂得隐藏自己的锋芒。
九二："见龙在田，利见大人。"时机成熟，要懂得展现自己的才华。
九三："君子终日乾乾，夕惕若，厉无咎。"始终保持警惕，才能避免过失。

易经的智慧，值得我们细细品味。`,
    author: '行者',
    tag: '分享',
    replies: 8,
    likes: 27,
    time: '5小时前'
  },
  '3': {
    id: 3,
    title: '如何通过冥想改善焦虑？',
    content: `最近工作压力很大，经常感到焦虑和紧张。听说冥想可以帮助缓解焦虑，想请教各位同修：

1. 冥想真的有效吗？
2. 初学者应该从哪种冥想开始？
3. 每天需要多长时间？
4. 有什么注意事项？

希望能得到大家的指导，谢谢！`,
    author: '真人',
    tag: '求助',
    replies: 15,
    likes: 43,
    time: '1天前'
  }
};

// 获取推荐帖子
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
    
    // 解析推荐结果，返回模拟推荐帖子
    // 实际项目中应该从数据库查询相似帖子
    return [
      { id: 101, title: '禅修入门指南', author: '静心', tag: '分享', similarity: '高度相关' },
      { id: 102, title: '正念呼吸法详解', author: '云游', tag: '心得', similarity: '相关' },
      { id: 103, title: '如何面对内心的恐惧', author: '行者', tag: '求助', similarity: '相关' },
    ];
  } catch (error) {
    console.error('获取推荐失败:', error);
    return [];
  }
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [recommendedPosts, setRecommendedPosts] = useState<RecommendedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取帖子详情
    const fetchPost = async () => {
      setLoading(true);
      
      // 模拟从数据库获取帖子
      const postData = mockPosts[postId] || {
        id: parseInt(postId),
        title: '帖子标题',
        content: '这是帖子的内容...',
        author: '匿名',
        tag: '心得',
        replies: 0,
        likes: 0,
        time: '刚刚'
      };
      
      setPost(postData);
      
      // 获取推荐帖子
      const recommendations = await getRecommendedPosts(postData.content);
      setRecommendedPosts(recommendations);
      
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
        {/* 返回链接 */}
        <Link 
          href="/tong/community" 
          className="inline-block mb-6 text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← 返回同修社区
        </Link>

        {/* 帖子详情 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          {/* 标签和作者信息 */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full font-medium">
              {post.tag}
            </span>
            <span className="text-sm text-gray-500">👤 {post.author}</span>
            <span className="text-sm text-gray-500">🕐 {post.time}</span>
          </div>

          {/* 标题 */}
          <h1 
            className="text-2xl font-bold text-gray-800 mb-6"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            {post.title}
          </h1>

          {/* 内容 */}
          <div 
            className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            {post.content}
          </div>

          {/* 互动按钮 */}
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
            💬 回复
          </h2>
          <textarea
            placeholder="写下你的回复..."
            className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 resize-none"
            rows={4}
          />
          <button 
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            发布回复
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