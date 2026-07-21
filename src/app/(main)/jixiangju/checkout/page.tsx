'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface Address {
  name: string;
  phone: string;
  detail: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState<Address>({ name: '', phone: '', detail: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {
      router.push('/jixiangju');
      return;
    }
    setCartItems(cart);
  }, [router]);

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleInputChange = (field: keyof Address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        items: cartItems,
        total_amount: totalPrice,
        shipping_address: address,
      };

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'single',
          userId: 'test-user',
          email: 'test@example.com',
          report: 'jixiangju',
          metadata: {
            orderData: JSON.stringify(orderData),
          },
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('创建支付会话失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('支付失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-8" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          ✨ 结账
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-[#C0C0C0] mb-4">收货地址</h2>
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#808080] text-sm mb-2">收件人姓名</label>
                <input
                  type="text"
                  value={address.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-[#C0C0C0] focus:border-[#D4AF37] focus:outline-none"
                  placeholder="请输入姓名"
                  required
                />
              </div>
              <div>
                <label className="block text-[#808080] text-sm mb-2">联系电话</label>
                <input
                  type="tel"
                  value={address.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-[#C0C0C0] focus:border-[#D4AF37] focus:outline-none"
                  placeholder="请输入手机号"
                  required
                />
              </div>
              <div>
                <label className="block text-[#808080] text-sm mb-2">详细地址</label>
                <textarea
                  value={address.detail}
                  onChange={(e) => handleInputChange('detail', e.target.value)}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-[#C0C0C0] focus:border-[#D4AF37] focus:outline-none resize-none"
                  rows={3}
                  placeholder="请输入详细地址"
                  required
                />
              </div>
            </form>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#C0C0C0] mb-4">订单商品</h2>
            <div className="bg-[#242424] rounded-xl p-4 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xl opacity-30">📦</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#C0C0C0] font-medium text-sm mb-1 line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-sm text-[#808080]">x{item.quantity}</p>
                  </div>
                  <div className="text-[#D4AF37] font-bold">
                    ¥{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-[#242424] rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#808080]">商品金额</span>
                <span className="text-[#C0C0C0]">¥{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#808080]">运费</span>
                <span className="text-[#C0C0C0]">免运费</span>
              </div>
              <div className="border-t border-[#333333] pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#C0C0C0] font-medium">实付金额</span>
                  <span className="text-2xl font-bold text-[#D4AF37]">¥{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 bg-[#D4AF37] text-[#1a1a1a] py-4 rounded-lg font-medium hover:bg-[#E5C142] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  处理中...
                </>
              ) : (
                '💳 立即支付'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
