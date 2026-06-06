
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HealingPage() {
  const [formData, setFormData] = useState({
    constitution: '阳虚',
    emotion: '焦虑'
  });
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_DIFY_HEALING_API_KEY;

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
            constitution: formData.constitution,
            emotion: formData.emotion
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
      const text = data?.data?.outputs?.healing_plan || data?.answer || data?.outputs?.healing_plan || '疗愈方案生成中...';
      setPlan(text);
    } catch (error) {
      console.error('AI 生成失败:', error);
      setPlan('AI 暂时不可用，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', color: '#2c2c2c', fontFamily: '"Ma Shan Zheng", serif' }}>身心疗愈</h1>
          <div style={{ width: '40px', height: '2px', background: '#2c2c2c', margin: '12px auto', opacity: 0.4 }} />
          <p style={{ fontSize: '16px', color: '#5a5a5a' }}>融合体质与情绪，定制专属疗愈方案</p>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid #e8e4e0' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#2c2c2c', marginBottom: '4px' }}>体质类型</label>
              <select
                value={formData.constitution}
                onChange={(e) => setFormData({ ...formData, constitution: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e8e4e0', fontSize: '14px' }}
              >
                <option value="阳虚">阳虚</option>
                <option value="阴虚">阴虚</option>
                <option value="气虚">气虚</option>
                <option value="血虚">血虚</option>
                <option value="痰湿">痰湿</option>
                <option value="气郁">气郁</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#2c2c2c', marginBottom: '4px' }}>情绪状态</label>
              <select
                value={formData.emotion}
                onChange={(e) => setFormData({ ...formData, emotion: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e8e4e0', fontSize: '14px' }}
              >
                <option value="焦虑">焦虑</option>
                <option value="压力">压力</option>
                <option value="迷茫">迷茫</option>
                <option value="孤独">孤独</option>
                <option value="悲伤">悲伤</option>
                <option value="愤怒">愤怒</option>
              </select>
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
              {loading ? 'AI 生成中...' : '获取疗愈方案'}
            </button>
          </form>

          {plan && (
            <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(44,44,44,0.03)', borderRadius: '12px', border: '1px solid #e8e4e0' }}>
              <h3 style={{ fontSize: '18px', color: '#2c2c2c', marginBottom: '12px' }}>综合疗愈方案</h3>
              <pre style={{ fontSize: '14px', color: '#2c2c2c', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {plan}
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
