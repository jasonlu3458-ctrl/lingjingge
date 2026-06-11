'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface TopicRow {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      // 获取所有带有「话题」标签的帖子
      const { data, error } = await supabase
        .from('topics')
        .select('id,title,content,created_at')
        .ilike('title', '%【话题】%')
        .order('created_at', { ascending: false });
      if (!error && data) setTopics(data as TopicRow[]);
      setLoading(false);
    };
    fetchTopics();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-serif" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}>
            话题聚合
          </h1>
          <Link href="/tong/community" className="text-sm text-emerald-600 hover:underline">
            ← 返回社区
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : topics.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">🪷</div>
            <p>暂无「【话题】」前缀的话题帖</p>
            <Link href="/tong/community/new" className="inline-block mt-4 text-emerald-600 hover:underline">
              发布新帖 →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map(topic => (
              <Link
                key={topic.id}
                href={`/tong/community/${topic.id}`}
                className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-serif mb-2 text-gray-800">{topic.title}</h2>
                <p className="text-gray-600 line-clamp-2">{topic.content}</p>
                <div className="mt-2 text-sm text-gray-500">
                  {new Date(topic.created_at).toLocaleString('zh-CN')}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
