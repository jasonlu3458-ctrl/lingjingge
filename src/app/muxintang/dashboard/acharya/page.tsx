'use client';

import { useState } from 'react';

const ORDERS = [
  { id: 'ORD20240101', type: 'scroll', recipient: '张三', status: 'pending', created_at: '2024-01-01 10:30', amount: 188 },
  { id: 'ORD20240102', type: 'bracelet', recipient: '李四', status: 'blessed', created_at: '2024-01-02 14:20', amount: 288 },
  { id: 'ORD20240103', type: 'sachet', recipient: '王五', status: 'shipped', created_at: '2024-01-03 09:15', amount: 88 },
  { id: 'ORD20240104', type: 'scroll', recipient: '赵六', status: 'completed', created_at: '2024-01-04 16:45', amount: 188 },
  { id: 'ORD20240105', type: 'bracelet', recipient: '孙七', status: 'pending', created_at: '2024-01-05 11:00', amount: 288 },
];

const CONSULTATIONS = [
  { id: 'CON20240101', creator: '任书颖阿阇梨', client: '刘八', question: '想了解2024年运势', status: 'pending', created_at: '2024-01-01 10:00' },
  { id: 'CON20240102', creator: '王师傅', client: '周九', question: '家中风水布局建议', status: 'in_progress', created_at: '2024-01-02 15:30' },
  { id: 'CON20240103', creator: '陈云道长', client: '吴十', question: '公司命名', status: 'completed', created_at: '2024-01-03 08:00' },
];

const STATUS_COLORS = {
  pending: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/50',
  blessed: 'bg-blue-900/50 text-blue-400 border-blue-700/50',
  shipped: 'bg-purple-900/50 text-purple-400 border-purple-700/50',
  completed: 'bg-green-900/50 text-green-400 border-green-700/50',
  cancelled: 'bg-red-900/50 text-red-400 border-red-700/50',
  in_progress: 'bg-blue-900/50 text-blue-400 border-blue-700/50',
};

const STATUS_LABELS = {
  pending: '待处理',
  blessed: '已祈福',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
  in_progress: '处理中',
};

const PRODUCT_LABELS = {
  scroll: '吉祥卷轴',
  bracelet: '吉祥手串',
  sachet: '吉祥香囊',
};

export default function AcharyaDashboardPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const [roleVerified, setRoleVerified] = useState(false);
  const [showLogin, setShowLogin] = useState(true);

  const handleRoleVerify = () => {
    setRoleVerified(true);
    setShowLogin(false);
  };

  if (showLogin && !roleVerified) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="muxintang-card p-8 max-w-md w-full">
          <h1 
            className="text-2xl font-bold mb-6 text-center"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            阿阇梨后台
          </h1>
          <p className="text-[#808080] text-center mb-6">请验证您的身份</p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="账号"
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
            <input
              type="password"
              placeholder="密码"
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
            <button
              onClick={handleRoleVerify}
              className="muxintang-btn w-full py-3"
            >
              登录
            </button>
          </div>
          <p className="text-[#555555] text-xs text-center mt-4">
            非授权用户请勿访问
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 
            className="text-3xl font-bold"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            阿阇梨后台
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-[#D4AF37]">任书颖阿阇梨</span>
            <button className="text-[#808080] hover:text-white">退出</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: '待处理订单', value: '2', color: 'text-yellow-400' },
            { label: '进行中咨询', value: '1', color: 'text-blue-400' },
            { label: '今日收益', value: '¥476', color: 'text-green-400' },
            { label: '本月订单', value: '5', color: 'text-[#D4AF37]' },
          ].map((stat) => (
            <div key={stat.label} className="muxintang-card p-4 text-center">
              <p className="text-2xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-sm text-[#808080]">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { id: 'orders', label: '订单看板' },
            { id: 'consultations', label: '咨询管理' },
            { id: 'stats', label: '数据统计' },
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
                  <th className="text-left p-4 text-sm text-[#808080]">时间</th>
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
                    <td className="p-4 text-sm text-[#808080]">{order.created_at}</td>
                    <td className="p-4">
                      <button className="text-[#D4AF37] text-sm hover:underline">处理</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'consultations' && (
          <div className="muxintang-card p-6">
            <div className="space-y-4">
              {CONSULTATIONS.map((consult) => (
                <div key={consult.id} className="bg-[#242424] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <span className="text-[#D4AF37] font-medium">{consult.id}</span>
                      <span className="text-[#808080]">|</span>
                      <span className="text-[#C0C0C0]">{consult.creator}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[consult.status as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[consult.status as keyof typeof STATUS_LABELS]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white mb-1">咨询人：{consult.client}</p>
                      <p className="text-sm text-[#808080]">问题：{consult.question}</p>
                    </div>
                    <span className="text-xs text-[#555555]">{consult.created_at}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="muxintang-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6">数据统计</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-[#D4AF37] font-medium mb-4">订单统计</h4>
                <div className="space-y-3">
                  {['卷轴 3单', '手串 2单', '香囊 1单'].map((item) => (
                    <div key={item} className="flex items-center justify-between">
                      <span className="text-[#808080]">{item}</span>
                      <span className="text-white">¥{(parseInt(item) * 188).toString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[#D4AF37] font-medium mb-4">咨询统计</h4>
                <div className="space-y-3">
                  {['八字命理 12次', '风水布局 8次', '择日吉时 5次', '起名改名 6次'].map((item) => (
                    <div key={item} className="flex items-center justify-between">
                      <span className="text-[#808080]">{item}</span>
                      <span className="text-white">{item.split(' ')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}