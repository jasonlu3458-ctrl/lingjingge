'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function MindPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '福生无量。这里是明心灯·疗愈。请告诉我，你今日的心事。' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: '心若冰清，天塌不惊。请随我慢慢道来。' }]);
    }, 1000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', color: '#2c2c2c', fontFamily: '"Ma Shan Zheng", serif' }}>明心灯 · 疗愈</h1>
          <div style={{ width: '40px', height: '2px', background: '#2c2c2c', margin: '12px auto', opacity: 0.4 }} />
          <p style={{ fontSize: '16px', color: '#5a5a5a' }}>情绪疏导 · 正念冥想 · 身心疗愈</p>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(44,44,44,0.04)', border: '1px solid #e8e4e0' }}>
          <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ textAlign: msg.role === 'assistant' ? 'left' : 'right', marginBottom: '12px' }}>
                <span style={{ display: 'inline-block', background: msg.role === 'assistant' ? '#ffffff' : '#e8e4e0', padding: '8px 16px', borderRadius: '12px', maxWidth: '80%', border: '1px solid #e8e4e0' }}>{msg.content}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="说出你的心事..." style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e8e4e0', background: '#ffffff' }} />
            <button onClick={sendMessage} style={{ padding: '12px 24px', background: '#2c2c2c', color: '#f5f0eb', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>说</button>
          </div>
        </div>
        <Link href="/home" style={{ display: 'inline-block', marginTop: '24px', color: '#5a5a5a', textDecoration: 'none', fontSize: '14px' }}>← 返回首页</Link>
      </div>
    </div>
  );
}
