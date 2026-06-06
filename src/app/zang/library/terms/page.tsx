
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function TermsPage() {
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTerms = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('terms')
        .select('*')
        .order('term', { ascending: true });

      if (error) {
        console.error('加载术语失败:', error);
      } else {
        setTerms(data || []);
      }
      setLoading(false);
    };
    fetchTerms();
  }, []);

  const filteredTerms = terms.filter(t =>
    t.term.includes(search) ||
    t.definition.includes(search) ||
    t.category?.includes(search)
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', color: '#2c2c2c', fontFamily: '"Ma Shan Zheng", serif' }}>术语百科</h1>
          <div style={{ width: '40px', height: '2px', background: '#2c2c2c', margin: '12px auto', opacity: 0.4 }} />
          <p style={{ fontSize: '16px', color: '#5a5a5a' }}>探索传统文化智慧，理解核心概念</p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="搜索术语..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e8e4e0',
              fontSize: '14px',
              background: '#ffffff'
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#5a5a5a' }}>加载中...</div>
        ) : filteredTerms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#5a5a5a' }}>暂无术语</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {filteredTerms.map((term) => (
              <div
                key={term.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #e8e4e0',
                  transition: 'all 0.3s'
                }}
              >
                <h3 style={{ fontSize: '20px', color: '#2c2c2c', marginBottom: '8px' }}>{term.term}</h3>
                <div style={{ fontSize: '12px', color: '#888888', marginBottom: '8px' }}>
                  {term.category && <span>分类: {term.category}</span>}
                  {term.pinyin && <span style={{ marginLeft: '12px' }}>拼音: {term.pinyin}</span>}
                </div>
                <p style={{ fontSize: '14px', color: '#5a5a5a', lineHeight: '1.6' }}>{term.definition}</p>
              </div>
            ))}
          </div>
        )}

        <Link href="/zang/library" style={{ display: 'inline-block', marginTop: '32px', color: '#5a5a5a', textDecoration: 'none', fontSize: '14px' }}>
          ← 返回藏经阁
        </Link>
      </div>
    </div>
  );
}
