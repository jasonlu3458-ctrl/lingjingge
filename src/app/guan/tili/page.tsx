
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TiliPage() {
  const [action, setAction] = useState('');
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_DIFY_TILI_API_KEY;

      if (!apiKey) {
        throw new Error('API Key 未配置，请检查环境变量');
      }

      const response = await fetch('https://api.dify.ai/v1/workflows/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            action: action
          },
          response_mode: 'blocking',
          user: 'user_001'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `请求失败: ${response.status}`);
      }

      const data = await response.json();
      const text = data?.data?.outputs?.advice || data?.answer || data?.outputs?.advice || '分析完成，请查看建议。';
      setAdvice(text);
    } catch (error) {
      console.error('AI 分析失败:', error);
      setAdvice('AI 暂时不可用，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', color: '#2c2c2c', fontFamily: '"Ma Shan Zheng", serif' }}>AI炼体师</h1>
          <div style={{ width: '40px', height: '2px', background: '#2c2c2c', margin: '12px auto', opacity: 0.4 }} />
          <p style={{ fontSize: '16px', color: '#5a5a5a' }}>描述动作，获取专业纠错建议</p>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid #e8e4e0' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#2c2c2c', marginBottom: '4px' }}>请描述您正在练习的动作</label>
              <textarea
                value={action}
                onChange={(e) => setAction(e.target.value)}
                rows={4}
                required
                placeholder="例如：我正在练习八段锦中的‘双手托天理三焦’，感觉手臂发力不均匀..."
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e8e4e0', fontSize: '14px', fontFamily: 'inherit' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
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
              {loading ? 'AI 分析中...' : '获取纠错建议'}
            </button>
          </form>

          {advice && (
            <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(44,44,44,0.03)', borderRadius: '12px', border: '1px solid #e8e4e0' }}>
              <h3 style={{ fontSize: '18px', color: '#2c2c2c', marginBottom: '12px' }}>动作分析报告</h3>
              <pre style={{ fontSize: '14px', color: '#2c2c2c', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {advice}
              </pre>
            </div>
          )}
        </div>

        <Link href="/home" style={{ display: 'inline-block', marginTop: '24px', color: '#5a5a5a', textDecoration: 'none', fontSize: '14px' }}>
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}
