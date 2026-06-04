'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function LibraryPage() {
  interface Article {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  author?: string;
  published_at: string;
  slug: string;
}

const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) {
        console.error('加载文章失败:', error);
      } else {
        setArticles(data || []);
      }
      setLoading(false);
    };
    fetchArticles();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '32px', color: '#2c2c2c', marginBottom: '8px' }}>藏 经 阁</h1>
          <div style={{ width: '40px', height: '2px', background: '#2c2c2c', margin: '16px auto', opacity: 0.4 }} />
          <p style={{ fontSize: '16px', color: '#5a5a5a', letterSpacing: '2px' }}>探索东方智慧，感悟生命真谛</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#5a5a5a' }}>加载中...</div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#5a5a5a' }}>暂无文章</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/library/${article.slug}`}
                style={{
                  display: 'block',
                  padding: '32px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(44,44,44,0.04)',
                  textDecoration: 'none',
                  transition: 'all 0.3s',
                  border: '1px solid #e8e4e0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(44,44,44,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(44,44,44,0.04)';
                }}
              >
                <h3 style={{ fontSize: '20px', color: '#2c2c2c', marginBottom: '8px' }}>{article.title}</h3>
                <p style={{ fontSize: '14px', color: '#5a5a5a', lineHeight: '1.6', marginBottom: '12px' }}>
                  {article.excerpt || article.content?.slice(0, 80) + '...'}
                </p>
                <div style={{ fontSize: '12px', color: '#888888', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{article.author || '灵境阁编辑部'}</span>
                  <span>{new Date(article.published_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
