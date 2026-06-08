
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '@/lib/supabase';

// 模拟数据
const mockTerms = [
  { id: '1', term: '见性', pinyin: 'jiàn xìng', category: '禅宗', definition: '禅宗术语，指彻见自心本性。即通过修行，破除妄想执着，直接体认自己本来具有的佛性。' },
  { id: '2', term: '无明', pinyin: 'wú míng', category: '佛教', definition: '佛教术语，指众生心中无有智慧，处于黑暗状态。无明是烦恼的根源，是生死轮回的根本原因。' },
  { id: '3', term: '般若', pinyin: 'bō rě', category: '佛教', definition: '梵语，意为智慧，特指超越世俗的智慧。般若智慧不同于普通的知识。' },
  { id: '4', term: '无为', pinyin: 'wú wéi', category: '道家', definition: '道家思想，顺其自然，不妄为。无为不是无所作为，而是指顺应事物的自然规律。' },
  { id: '5', term: '太极', pinyin: 'tài jí', category: '易经', definition: '易学概念，指宇宙万物的本源。太极生两仪，两仪生四象，四象生八卦。' },
  { id: '6', term: '五行', pinyin: 'wǔ xíng', category: '道家', definition: '金、木、水、火、土五种基本元素，代表宇宙万物的构成和相互关系。' },
];

export default function TermsPage() {
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let isFetched = false; // 防止重复调用

    const fetchTerms = async () => {
      // 防止重复调用
      if (isFetched) return;
      isFetched = true;

      try {
        if (!mounted) return;
        setLoading(true);
        setError(null);

        // 检查 Supabase 是否配置
        if (!isSupabaseConfigured()) {
          console.log('Supabase 未配置，使用模拟数据');
          if (mounted) {
            setTerms(mockTerms);
            setLoading(false);
          }
          return;
        }

        // 先测试数据库连接
        console.log('正在测试数据库连接...');
        const connectionOk = await testSupabaseConnection();
        
        if (!connectionOk) {
          console.log('数据库连接失败，使用模拟数据');
          if (mounted) {
            setTerms(mockTerms);
            setError('数据库连接失败，已切换到演示模式');
            setLoading(false);
          }
          return;
        }

        console.log('数据库连接成功，开始获取术语数据...');

        const { data, error: fetchError } = await supabase
          .from('terms')
          .select('*')
          .order('term', { ascending: true });

        if (!mounted) return;

        if (fetchError) {
          console.error('获取术语数据失败:', fetchError);
          setTerms(mockTerms);
        } else {
          setTerms(data?.length > 0 ? data : mockTerms);
        }

      } catch (err) {
        console.error('加载术语失败:', err);
        if (mounted) {
          setTerms(mockTerms);
          setError(err instanceof Error ? err.message : '加载失败，已切换到演示模式');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTerms();

    return () => {
      mounted = false;
    };
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
