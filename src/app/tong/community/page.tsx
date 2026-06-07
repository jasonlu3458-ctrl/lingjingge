'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'latest' | 'essence' | 'topics'>('latest');

  // 每日话题（置顶）
  const dailyTopic = {
    id: 0,
    title: '【每日参究】什么是真正的放下？',
    content: '放下不是逃避，而是面对。今天，让我们一起探讨放下的真谛。',
    author: '系统',
    tag: '每日话题',
    isPinned: true
  };

  // 模拟数据（实际需从 Supabase 获取）
  const posts = [
    { id: 1, title: '今日参悟：什么是真正的放下？', author: '云游', replies: 12, likes: 34, time: '2小时前', tag: '心得' },
    { id: 2, title: '我观易经：乾卦的启示', author: '行者', replies: 8, likes: 27, time: '5小时前', tag: '分享' },
    { id: 3, title: '如何通过冥想改善焦虑？', author: '真人', replies: 15, likes: 43, time: '1天前', tag: '求助' },
    { id: 4, title: '禅修日记：第七天的觉察', author: '静心', replies: 6, likes: 18, time: '2天前', tag: '心得' },
    { id: 5, title: '从道德经看现代生活', author: '无为', replies: 11, likes: 31, time: '2天前', tag: '分享' },
  ];

  const essencePosts = [
    { id: 101, title: '【精华】禅宗公案解读：赵州茶', author: '行者', replies: 28, likes: 89, time: '1周前', tag: '分享' },
    { id: 102, title: '【精华】从八字看人生轨迹', author: '真人', replies: 19, likes: 62, time: '2周前', tag: '问卦' },
    { id: 103, title: '【精华】正念呼吸的科学原理', author: '静心', replies: 34, likes: 102, time: '3周前', tag: '心得' },
    { id: 104, title: '【精华】易经六十四卦详解', author: '云游', replies: 42, likes: 156, time: '1月前', tag: '分享' },
  ];

  const topics = [
    { id: 201, title: '#如何应对职场压力#', count: 34, description: '探讨工作与修行的平衡' },
    { id: 202, title: '#什么是真正的修行#', count: 28, description: '关于修行本质的讨论' },
    { id: 203, title: '#AI与东方智慧#', count: 19, description: '人工智能与传统智慧的碰撞' },
    { id: 204, title: '#每日觉察日记#', count: 56, description: '记录每一天的觉察与成长' },
    { id: 205, title: '#经典研读#', count: 23, description: '一起研读经典著作' },
    { id: 206, title: '#禅修体验分享#', count: 31, description: '分享你的禅修感悟' },
  ];

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

        {/* 每日话题（置顶） */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 shadow-sm border border-purple-200 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full font-medium">
              📌 置顶
            </span>
            <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full font-medium">
              {dailyTopic.tag}
            </span>
          </div>
          <Link 
            href={`/tong/community/${dailyTopic.id}`}
            className="block"
          >
            <h3 
              className="text-lg font-medium text-purple-800 mb-2 hover:text-purple-600 transition-colors"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            >
              {dailyTopic.title}
            </h3>
            <p className="text-sm text-purple-600">{dailyTopic.content}</p>
          </Link>
        </div>

        {/* 内容区 */}
        <div className="space-y-4">
          {activeTab === 'latest' && (
            <div className="space-y-4">
              {posts.map((post) => (
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
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>👤 {post.author}</span>
                    <span>🕐 {post.time}</span>
                    <span>💬 {post.replies} 回复</span>
                    <span>❤️ {post.likes} 喜欢</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'essence' && (
            <div className="space-y-4">
              {essencePosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/tong/community/${post.id}`}
                  className="block bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 shadow-sm border border-amber-200 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full font-medium">
                      💎 精华
                    </span>
                    <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full font-medium">
                      {post.tag}
                    </span>
                    <span className="text-xs text-gray-500">{post.time}</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3 hover:text-gray-600 transition-colors"
                      style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>👤 {post.author}</span>
                    <span>💬 {post.replies} 回复</span>
                    <span>❤️ {post.likes} 喜欢</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topics.map((topic) => (
                <div 
                  key={topic.id} 
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border border-emerald-100"
                >
                  <h3 className="text-lg font-medium text-emerald-800 mb-2"
                      style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                    {topic.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{topic.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {topic.count} 篇讨论
                    </span>
                    <span className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">
                      进入讨论 →
                    </span>
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
