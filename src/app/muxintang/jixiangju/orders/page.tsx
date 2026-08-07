'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface Order {
  id: string;
  tenant_id: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
  created_at: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待支付', color: 'text-yellow-400' },
  paid: { label: '已支付', color: 'text-green-400' },
  shipped: { label: '已发货', color: 'text-blue-400' },
  completed: { label: '已完成', color: 'text-gray-400' },
};

export default function MuxintangOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = JSON.parse(localStorage.getItem('muxintang_orders') || '[]');
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-8" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          📋 我的订单
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-6xl mb-4">📋</p>
            <p className="text-[#808080] mb-4">暂无订单</p>
            <Link
              href="/muxintang/jixiangju"
              className="bg-[#8B4513] text-[#D4AF37] px-6 py-3 rounded-lg hover:bg-[#A0522D] transition-colors"
            >
              去选购
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#242424] rounded-xl border border-[#333333] overflow-hidden">
                <div className="p-4 border-b border-[#333333] flex items-center justify-between">
                  <div>
                    <span className="text-[#808080] text-sm">订单号：{order.id.slice(0, 16)}</span>
                    <span className="text-[#808080] text-sm ml-4">
                      {new Date(order.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <span className={`font-medium ${statusLabels[order.status]?.color || 'text-gray-400'}`}>
                    {statusLabels[order.status]?.label || order.status}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[#C0C0C0]">{item.name}</h3>
                        <p className="text-sm text-[#808080]">x{item.quantity}</p>
                      </div>
                      <span className="text-[#D4AF37] font-bold">¥{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-[#1a1a1a] flex items-center justify-between">
                  <span className="text-[#808080]">共 {order.items.length} 件商品</span>
                  <div>
                    <span className="text-[#808080]">合计：</span>
                    <span className="text-xl font-bold text-[#D4AF37]">¥{order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
