'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function NewTopicPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('请先登录后再发布话题');
        return;
      }

      const { error: insertError } = await supabase
        .from('topics')
        .insert({
          user_id: user.id as string,
          title: title as string,
          content: content as string,
          created_at: new Date().toISOString()
        } as any);

      if (insertError) {
        setError(`发布失败: ${insertError.message}`);
      } else {
        router.push('/community');
      }
    } catch (err) {
      setError(`发布异常: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', color: '#2c2c2c', fontFamily: '"Ma Shan Zheng", serif' }}>发布话题</h1>
          <div style={{ width: '40px', height: '2px', background: '#2c2c2c', margin: '12px auto', opacity: 0.4 }} />
          <p style={{ fontSize: '16px', color: '#5a5a5a' }}>分享您的修行心得</p>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid #e8e4e0' }}>
          {error && (
            <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', marginBottom: '24px', borderRadius: '8px' }}>
              <p style={{ color: '#b91c1c', fontSize: '14px' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#2c2c2c', marginBottom: '8px', fontWeight: 500 }}>话题标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="请输入话题标题..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e8e4e0',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#2c2c2c', marginBottom: '8px', fontWeight: 500 }}>话题内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={8}
                placeholder="请详细描述您想分享的内容..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e8e4e0',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#2c2c2c',
                  color: '#f5f0eb',
                  borderRadius: '30px',
                  border: 'none',
                  fontSize: '16px',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? '发布中...' : '发布话题'}
              </button>
              <Link
                href="/tong/community"
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#ffffff',
                  color: '#2c2c2c',
                  borderRadius: '30px',
                  border: '1px solid #2c2c2c',
                  fontSize: '16px',
                  letterSpacing: '2px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  boxSizing: 'border-box'
                }}
              >
                取消
              </Link>
            </div>
          </form>
        </div>

        <Link href="/tong/community" style={{ display: 'inline-block', marginTop: '24px', color: '#5a5a5a', textDecoration: 'none', fontSize: '14px' }}>
          ← 返回同修会
        </Link>
      </div>
    </div>
  );
}