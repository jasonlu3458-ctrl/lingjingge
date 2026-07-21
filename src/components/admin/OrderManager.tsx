'use client';

import { useState, useEffect } from 'react';

interface Order {
  id: string;
  user_id: string;
  items: { name: string; price: number; quantity: number }[];
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  created_at: string;
}

const statusLabels: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400',
  paid: 'bg-blue-900/30 text-blue-400',
  shipped: 'bg-purple-900/30 text-purple-400',
  completed: 'bg-green-900/30 text-green-400',
  cancelled: 'bg-gray-900/30 text-gray-400',
};

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/orders');
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      fetchOrders();
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
      <h2 className="text-xl font-semibold text-[#D4AF37] mb-6" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
        📋 订单管理
      </h2>

      {loading ? (
        <div className="text-center py-8 text-[#808080]">加载中...</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-[#242424] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[#C0C0C0] font-medium">订单号: {order.id}</p>
                  <p className="text-xs text-[#808080]">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#D4AF37] font-bold">¥{order.total_amount}</span>
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className={`px-3 py-1 rounded text-sm ${statusColors[order.status]} border border-transparent`}
                  >
                    {Object.keys(statusLabels).map((key) => (
                      <option key={key} value={key} className="bg-[#1a1a1a]">
                        {statusLabels[key]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="border-t border-[#333333] pt-3">
                <p className="text-xs text-[#808080] mb-2">商品列表:</p>
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item, index) => (
                    <span key={index} className="text-sm text-[#C0C0C0]">
                      {item.name} x{item.quantity} (¥{item.price})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}