'use client';

import { useState } from 'react';

const ORDERS = [
  { id: 'ORD20240101', type: 'scroll', recipient: '张三', status: 'pending', created_at: '2024-01-01 10:30', amount: 188 },
  { id: 'ORD20240102', type: 'bracelet', recipient: '李四', status: 'blessed', created_at: '2024-01-02 14:20', amount: 288 },
  { id: 'ORD20240103', type: 'sachet', recipient: '王五', status: 'shipped', created_at: '2024-01-03 09:15', amount: 88 },
  { id: 'ORD20240104', type: 'scroll', recipient: '赵六', status: 'completed', created_at: '2024-01-04 16:45', amount: 188 },
];

const COMMENTS = [
  { id: 1, user: '缘主小李', content: '阿阇梨的风水建议非常实用，家里的气场明显改善了！', status: 'pending', created_at: '2024-01-01 10:00' },
  { id: 2, user: '缘主王芳', content: '八字排盘很准，大运流年的分析让我对未来更有信心了。', status: 'approved', created_at: '2024-01-02 15:30' },
  { id: 3, user: '缘主刘八', content: '感谢阿阇梨的指点，生意越来越好了！', status: 'pending', created_at: '2024-01-03 08:00' },
];

const STATUS_COLORS = {
  pending: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50',
  blessed: 'bg-blue-900/50 text-blue-400 border-blue-700/50',
  shipped: 'bg-purple-900/50 text-purple-400 border-purple-700/50',
  completed: 'bg-green-900/50 text-green-400 border-green-700/50',
  approved: 'bg-green-900/50 text-green-400 border-green-700/50',
};

const STATUS_LABELS = {
  pending: '待处理',
  blessed: '已祈福',
  shipped: '已发货',
  completed: '已完成',
  approved: '已通过',
};

const PRODUCT_LABELS = {
  scroll: '吉祥卷轴',
  bracelet: '吉祥手串',
  sachet: '吉祥香囊',
};

export default function AcharyaDashboard() {
  const [activeTab, setActiveTab] = useState('orders');

  const stats = [
    { label: '待处理订单', value: '2', color: 'text-yellow-400' },
    { label: '待审核评论', value: '2', color: 'text-blue-400' },
    { label: '本月收益', value: '¥752', color: 'text-green-400' },
    { label: '服务次数', value: '12', color: 'text-[#D4AF37]' },
  ];

  const handleOrderAction = (orderId: string, action: string) => {
    console.log(`Order ${orderId} ${action}`);
  };

  const handleCommentAction = (commentId: number, action: string) => {
    console.log(`Comment ${commentId} ${action}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="muxintang-card p-4 text-center">
            <p className="text-2xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-sm text-[#808080]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { id: 'orders', label: '订单管理' },
          { id: 'comments', label: '评论审核' },
          { id: 'consultations', label: '咨询管理' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-[#8B4513] text-[#D4AF37]'
                : 'bg-[#242424] text-[#808080] hover:bg-[#333333]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div className="muxintang-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#333333]">
                <th className="text-left p-4 text-sm text-[#808080]">订单号</th>
                <th className="text-left p-4 text-sm text-[#808080]">商品</th>
                <th className="text-left p-4 text-sm text-[#808080]">请奉人</th>
                <th className="text-left p-4 text-sm text-[#808080]">金额</th>
                <th className="text-left p-4 text-sm text-[#808080]">状态</th>
                <th className="text-left p-4 text-sm text-[#808080]">操作</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((order) => (
                <tr key={order.id} className="border-b border-[#333333]/50 hover:bg-[#242424]">
                  <td className="p-4 text-sm text-white">{order.id}</td>
                  <td className="p-4 text-sm text-[#C0C0C0]">{PRODUCT_LABELS[order.type as keyof typeof PRODUCT_LABELS]}</td>
                  <td className="p-4 text-sm text-[#C0C0C0]">{order.recipient}</td>
                  <td className="p-4 text-sm text-[#D4AF37]">¥{order.amount}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                    </span>
                  </td>
                  <td className="p-4">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleOrderAction(order.id, 'bless')}
                        className="text-[#D4AF37] text-sm hover:underline"
                      >
                        祈福加持
                      </button>
                    )}
                    {order.status === 'blessed' && (
                      <button 
                        onClick={() => handleOrderAction(order.id, 'ship')}
                        className="text-[#D4AF37] text-sm hover:underline"
                      >
                        发货
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button 
                        onClick={() => handleOrderAction(order.id, 'complete')}
                        className="text-[#D4AF37] text-sm hover:underline"
                      >
                        完成
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="muxintang-card p-6">
          <div className="space-y-4">
            {COMMENTS.map((comment) => (
              <div key={comment.id} className="bg-[#242424] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#D4AF37] font-medium">{comment.user}</span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[comment.status as keyof typeof STATUS_COLORS]}`}>
                    {STATUS_LABELS[comment.status as keyof typeof STATUS_LABELS]}
                  </span>
                </div>
                <p className="text-[#C0C0C0] text-sm mb-3">{comment.content}</p>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[#555555]">{comment.created_at}</span>
                  {comment.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleCommentAction(comment.id, 'approve')}
                        className="text-green-400 text-sm hover:underline"
                      >
                        通过
                      </button>
                      <button 
                        onClick={() => handleCommentAction(comment.id, 'reject')}
                        className="text-red-400 text-sm hover:underline"
                      >
                        拒绝
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'consultations' && (
        <div className="muxintang-card p-6">
          <div className="space-y-4">
            {[
              { id: 'CON001', client: '缘主张三', question: '想了解2024年运势', status: 'pending', time: '2024-01-01 10:00' },
              { id: 'CON002', client: '缘主李四', question: '家中风水布局建议', status: 'in_progress', time: '2024-01-02 15:30' },
            ].map((consult) => (
              <div key={consult.id} className="bg-[#242424] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#D4AF37] font-medium">{consult.client}</span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${consult.status === 'pending' ? STATUS_COLORS.pending : STATUS_COLORS.blessed}`}>
                    {consult.status === 'pending' ? '待回复' : '处理中'}
                  </span>
                </div>
                <p className="text-[#C0C0C0] text-sm mb-3">{consult.question}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#555555]">{consult.time}</span>
                  <button className="text-[#D4AF37] text-sm hover:underline">
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}