
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function CommunityPage() {
  const [checkins, setCheckins] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 获取打卡数据
      const { data: checkinData } = await supabase
        .from('checkins')
        .select('*')
        .order('created_at', { ascending: false });
      setCheckins(checkinData || []);

      // 获取话题数据
      const { data: topicData } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });
      setTopics(topicData || []);

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleCheckin = async (type: string) => {
    const supabase = createClient();
    if (user) {
      await supabase.from('checkins').insert({
        user_id: user.id as string,
        type: type as string
      } as any);
      // 刷新数据
      window.location.reload();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', color: '#2c2c2c', fontFamily: '"Ma Shan Zheng", serif' }}>同修会</h1>
          <div style={{ width: '40px', height: '2px', background: '#2c2c2c', margin: '12px auto', opacity: 0.4 }} />
          <p style={{ fontSize: '16px', color: '#5a5a5a' }}>众行致远，共修同行</p>
        </div>

        {/* 打卡区域 */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '32px', border: '1px solid #e8e4e0' }}>
          <h3 style={{ fontSize: '18px', color: '#2c2c2c', marginBottom: '16px' }}>今日打卡</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['禅坐', '炼体', '冥想'].map((type) => (
              <button
                key={type}
                onClick={() => handleCheckin(type)}
                style={{
                  padding: '8px 24px',
                  background: '#2c2c2c',
                  color: '#f5f0eb',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 打卡榜 */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '32px', border: '1px solid #e8e4e0' }}>
          <h3 style={{ fontSize: '18px', color: '#2c2c2c', marginBottom: '16px' }}>同修榜</h3>
          <div style={{ fontSize: '14px', color: '#5a5a5a' }}>
            {checkins.length === 0 ? (
              <p>暂无打卡记录</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {checkins.slice(0, 10).map((c, i) => (
                  <li key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #e8e4e0' }}>
                    {i + 1}. {c.type} · {new Date(c.created_at).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 话题区域 */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e8e4e0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', color: '#2c2c2c' }}>共修话题</h3>
            <Link href="/community/new" style={{ padding: '6px 16px', background: '#2c2c2c', color: '#f5f0eb', borderRadius: '20px', textDecoration: 'none', fontSize: '14px' }}>
              发布话题
            </Link>
          </div>
          {topics.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#5a5a5a' }}>暂无话题</p>
          ) : (
            topics.map((topic) => (
              <div key={topic.id} style={{ padding: '16px 0', borderBottom: '1px solid #e8e4e0' }}>
                <h4 style={{ fontSize: '16px', color: '#2c2c2c', marginBottom: '4px' }}>{topic.title}</h4>
                <p style={{ fontSize: '14px', color: '#5a5a5a', marginBottom: '4px' }}>{topic.content}</p>
                <div style={{ fontSize: '12px', color: '#888888' }}>
                  {new Date(topic.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        <Link href="/home" style={{ display: 'inline-block', marginTop: '32px', color: '#5a5a5a', textDecoration: 'none', fontSize: '14px' }}>
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}
