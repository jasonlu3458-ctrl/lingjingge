'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AnalyticsData {
  orders: {
    today: number;
    week: number;
    month: number;
    compareLastMonth: number;
  };
  aiCalls: {
    currentMonth: number;
    lastMonth: number;
  };
  activeUsers: {
    daily: number;
    weekly: number;
  };
  paywallClicks: {
    singleUnlock: number;
    monthlyMember: number;
  };
}

const mockInsights = `## 📊 核心发现

- **八字工具最受欢迎**：最近30天用户查询八字的次数最多，说明命理测算仍是核心需求。
- **风水咨询增长明显**：家居环境相关的访问量环比增长28%，用户对空间布局关注度上升。
- **移动端访问占比高**：76%的访问来自手机，建议优化移动端体验。

## 💰 潜在付费机会

- **高频八字用户**：近30天查询超过5次的用户中，有45%尚未购买会员，可推送专属优惠。
- **风水深度用户**：访问家居环境工具后，购买报告的转化率达18%，可增加相关内容。

## 🚀 推荐动作

- 推出"八字年度报告"限时优惠，针对高频查询用户定向推送
- 新增风水专题内容，结合节气推出"家居开运指南"系列`;

const mockData: AnalyticsData = {
  orders: {
    today: 12,
    week: 89,
    month: 324,
    compareLastMonth: 12.5,
  },
  aiCalls: {
    currentMonth: 2847,
    lastMonth: 2356,
  },
  activeUsers: {
    daily: 156,
    weekly: 892,
  },
  paywallClicks: {
    singleUnlock: 45,
    monthlyMember: 23,
  },
};

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData>(mockData);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string>(mockInsights);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchInsights();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/analytics');
    const responseData = await res.json();
    if (responseData.data) {
      setData(responseData.data);
    }
    setLoading(false);
  };

  const fetchInsights = async () => {
    setInsightsLoading(true);
    const res = await fetch('/api/admin/analytics/insights');
    const responseData = await res.json();
    if (responseData.insights) {
      setInsights(responseData.insights);
    }
    setInsightsLoading(false);
  };

  const statCards = [
    {
      title: '今日订单',
      value: data.orders.today,
      icon: '📋',
      color: '#D4AF37',
      subtext: `本周 ${data.orders.week} | 本月 ${data.orders.month}`,
      trend: data.orders.compareLastMonth,
    },
    {
      title: 'AI 调用次数',
      value: data.aiCalls.currentMonth,
      icon: '🤖',
      color: '#8B4513',
      subtext: `上月 ${data.aiCalls.lastMonth}`,
      trend: Math.round(((data.aiCalls.currentMonth - data.aiCalls.lastMonth) / data.aiCalls.lastMonth) * 100),
    },
    {
      title: '日活用户',
      value: data.activeUsers.daily,
      icon: '👥',
      color: '#22c55e',
      subtext: `周活 ${data.activeUsers.weekly}`,
      trend: null,
    },
    {
      title: '付费墙触发',
      value: data.paywallClicks.singleUnlock + data.paywallClicks.monthlyMember,
      icon: '🔒',
      color: '#3b82f6',
      subtext: `单次 ${data.paywallClicks.singleUnlock} | 会员 ${data.paywallClicks.monthlyMember}`,
      trend: null,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          📊 数据看板
        </h1>
        <p className="text-[#808080] mt-2">欢迎回来，查看您的道场运营数据</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#808080]">加载中...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statCards.map((card) => (
              <div
                key={card.title}
                className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">{card.icon}</span>
                  {card.trend !== null && card.trend !== undefined && (
                    <span className={`text-sm ${card.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {card.trend >= 0 ? '↑' : '↓'} {Math.abs(card.trend)}%
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold mb-1" style={{ color: card.color }}>
                  {card.value.toLocaleString()}
                </p>
                <p className="text-sm text-[#808080]">{card.title}</p>
                <p className="text-xs text-[#666666] mt-2">{card.subtext}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">📈 订单趋势</h3>
              <div className="flex items-end justify-between h-40 gap-2">
                {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, index) => {
                  const height = 30 + Math.random() * 60;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full rounded-t"
                        style={{ 
                          height: `${height}%`, 
                          backgroundColor: '#8B4513',
                          opacity: 0.7 + Math.random() * 0.3,
                        }}
                      />
                      <span className="text-xs text-[#808080]">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">🎯 用户分布</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-[#C0C0C0]">免费用户</span>
                    <span className="text-sm text-[#D4AF37]">68%</span>
                  </div>
                  <div className="h-2 bg-[#242424] rounded-full overflow-hidden">
                    <div className="h-full bg-[#808080] rounded-full" style={{ width: '68%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-[#C0C0C0]">月度会员</span>
                    <span className="text-sm text-[#D4AF37]">22%</span>
                  </div>
                  <div className="h-2 bg-[#242424] rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: '22%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-[#C0C0C0]">年度会员</span>
                    <span className="text-sm text-[#D4AF37]">10%</span>
                  </div>
                  <div className="h-2 bg-[#242424] rounded-full overflow-hidden">
                    <div className="h-full bg-[#8B4513] rounded-full" style={{ width: '10%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
            <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">📝 最近活动</h3>
            <div className="space-y-3">
              {[
                { time: '2分钟前', action: '用户完成了一次 AI 对话', type: 'ai' },
                { time: '15分钟前', action: '用户购买了月度会员', type: 'payment' },
                { time: '1小时前', action: '新用户注册', type: 'user' },
                { time: '2小时前', action: '用户解锁了运势报告', type: 'report' },
                { time: '3小时前', action: '用户发布了研学帖子', type: 'content' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-[#333333]">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      item.type === 'ai' ? 'bg-[#8B4513]' :
                      item.type === 'payment' ? 'bg-green-500' :
                      item.type === 'user' ? 'bg-blue-500' :
                      item.type === 'report' ? 'bg-yellow-500' : 'bg-purple-500'
                    }`} />
                    <span className="text-[#C0C0C0]">{item.action}</span>
                  </div>
                  <span className="text-xs text-[#808080]">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#D4AF37]">🤖 AI 运营洞察</h3>
              <button
                onClick={fetchInsights}
                disabled={insightsLoading}
                className="bg-[#8B4513] text-[#D4AF37] px-4 py-2 rounded-lg hover:bg-[#A0522D] transition-colors text-sm disabled:opacity-50"
              >
                {insightsLoading ? '分析中...' : '🔄 刷新分析'}
              </button>
            </div>
            {insightsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                {insights.split('\n').map((line, index) => {
                  if (line.startsWith('## ')) {
                    return (
                      <h4 key={index} className="text-[#D4AF37] font-semibold mt-4 mb-2">
                        {line.slice(3)}
                      </h4>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <p key={index} className="text-[#C0C0C0] text-sm pl-4 mb-1">
                        {line}
                      </p>
                    );
                  }
                  return <p key={index} className="text-[#C0C0C0] text-sm mb-1">{line}</p>;
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/poster-generator" className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333333] hover:border-[#D4AF37] transition-all cursor-pointer">
              <div className="text-3xl mb-2">🎨</div>
              <p className="text-[#D4AF37] font-medium">海报生成器</p>
              <p className="text-xs text-[#808080] mt-1">自动生成传播海报</p>
            </Link>
            <Link href="/admin/long-article" className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333333] hover:border-[#D4AF37] transition-all cursor-pointer">
              <div className="text-3xl mb-2">📚</div>
              <p className="text-[#D4AF37] font-medium">长文生成器</p>
              <p className="text-xs text-[#808080] mt-1">AI 自动生成长篇文章</p>
            </Link>
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333333]">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-[#D4AF37] font-medium">数据导出</p>
              <p className="text-xs text-[#808080] mt-1">导出运营数据报告</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333333]">
              <div className="text-3xl mb-2">🔔</div>
              <p className="text-[#D4AF37] font-medium">推送管理</p>
              <p className="text-xs text-[#808080] mt-1">管理订阅用户和推送</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}