'use client';

import { useState, useEffect } from 'react';

interface ActivityStats {
  meditationMinutes: number;
  chatSessions: number;
  reportsGenerated: number;
  gonganSolved: number;
}

export default function ActivityStats() {
  const [stats, setStats] = useState<ActivityStats>({
    meditationMinutes: 0,
    chatSessions: 0,
    reportsGenerated: 0,
    gonganSolved: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/activity')
      .then(res => res.json())
      .then(data => {
        if (data.activity) {
          // 计算统计数据
          const meditation = data.activity.filter(a => a.activity_type === 'meditation');
          const chats = data.activity.filter(a => a.activity_type === 'chat');
          const reports = data.activity.filter(a => a.activity_type === 'report');
          const gongans = data.activity.filter(a => a.activity_type === 'gongan');
          
          setStats({
            meditationMinutes: meditation.reduce((sum, a) => sum + (a.duration_minutes || 0), 0),
            chatSessions: chats.length,
            reportsGenerated: reports.length,
            gonganSolved: gongans.length,
          });
        }
      })
      .catch(err => console.error('获取活动数据失败:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="text-2xl font-serif text-[#2c2c2c]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          {stats.meditationMinutes}
        </div>
        <div className="text-sm text-gray-500">冥想分钟</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="text-2xl font-serif text-[#2c2c2c]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          {stats.chatSessions}
        </div>
        <div className="text-sm text-gray-500">对话次数</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="text-2xl font-serif text-[#2c2c2c]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          {stats.reportsGenerated}
        </div>
        <div className="text-sm text-gray-500">报告生成</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="text-2xl font-serif text-[#2c2c2c]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          {stats.gonganSolved}
        </div>
        <div className="text-sm text-gray-500">参悟公案</div>
      </div>
    </div>
  );
}