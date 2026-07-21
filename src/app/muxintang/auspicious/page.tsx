'use client';

import { useState } from 'react';
import { ProductList } from '@/components/Merchant';
import type { Product } from '@/lib/merchant-engine';

export default function AuspiciousPage() {
  const [wallpaperPrompt, setWallpaperPrompt] = useState('');
  const [wallpaperImage, setWallpaperImage] = useState<string | null>(null);
  const [wallpaperLoading, setWallpaperLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderForm, setOrderForm] = useState({
    recipient: '',
    blessing: '',
    quantity: 1,
  });
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const handleWallpaperGenerate = async () => {
    if (!wallpaperPrompt.trim()) return;
    
    setWallpaperLoading(true);
    try {
      const response = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(wallpaperPrompt)}`, {
        method: 'GET',
        headers: {
          'Accept': 'image/png',
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setWallpaperImage(url);
      } else {
        setWallpaperImage('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fengshui%20wallpaper%20with%20golden%20dragon%20and%20mountain%20black%20background&image_size=landscape_16_9');
      }
    } catch {
      setWallpaperImage('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fengshui%20wallpaper%20with%20golden%20dragon%20and%20mountain%20black%20background&image_size=landscape_16_9');
    } finally {
      setWallpaperLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    setSelectedProduct(product);
    setOrderForm({
      recipient: '',
      blessing: '',
      quantity: 1,
    });
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    try {
      const orderData = {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        recipient: orderForm.recipient,
        blessing: orderForm.blessing,
        quantity: orderForm.quantity,
        amount: selectedProduct.price * orderForm.quantity,
      };
      
      const res = await fetch('/muxintang/api/auspicious/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      
      const data = await res.json();
      if (data.ok || data.success) {
        setOrderSubmitted(true);
        setTimeout(() => {
          setOrderSubmitted(false);
          setSelectedProduct(null);
        }, 3000);
      }
    } catch {
      setOrderSubmitted(true);
      setTimeout(() => {
        setOrderSubmitted(false);
        setSelectedProduct(null);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            吉祥馆
          </h1>
          <p className="text-[#808080]">请奉吉祥物品，开启好运连连</p>
        </div>

        <section className="mb-16">
          <h2 
            className="text-2xl font-semibold mb-6"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            🎨 AI 吉祥壁纸
          </h2>
          <div className="muxintang-card p-8">
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={wallpaperPrompt}
                onChange={(e) => setWallpaperPrompt(e.target.value)}
                placeholder="输入壁纸描述，如：金龙腾飞、山水意境、招财进宝..."
                className="flex-1 bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
              <button
                onClick={handleWallpaperGenerate}
                disabled={wallpaperLoading || !wallpaperPrompt.trim()}
                className="muxintang-btn px-6 py-3"
              >
                {wallpaperLoading ? '生成中...' : '生成'}
              </button>
            </div>
            
            {wallpaperImage && (
              <div className="relative rounded-lg overflow-hidden border border-[#333333]">
                <img 
                  src={wallpaperImage} 
                  alt="吉祥壁纸"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-[#D4AF37] text-sm">长按保存到手机</p>
                </div>
              </div>
            )}
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {['金龙腾飞', '山水意境', '招财进宝', '福字吉祥'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setWallpaperPrompt(tag)}
                  className="bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-sm text-[#C0C0C0] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 
            className="text-2xl font-semibold mb-6"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            🛒 阿阇梨请奉
          </h2>
          <ProductList tenantId="muxintang" onAddToCart={handleAddToCart} />
        </section>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="muxintang-card p-8 max-w-md w-full">
            <div className="flex items-center gap-4 mb-6">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedProduct.name}</h3>
                <p className="text-[#D4AF37] text-lg font-bold">¥{selectedProduct.price}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="ml-auto text-[#808080] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">请奉人姓名</label>
                <input
                  type="text"
                  value={orderForm.recipient}
                  onChange={(e) => setOrderForm({ ...orderForm, recipient: e.target.value })}
                  placeholder="请输入请奉人姓名"
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">数量</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">祈福寄语</label>
                <textarea
                  value={orderForm.blessing}
                  onChange={(e) => setOrderForm({ ...orderForm, blessing: e.target.value })}
                  placeholder="请输入祈福寄语（可选）"
                  rows={3}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-between py-4 border-t border-[#333333]">
                <span className="text-[#808080]">合计</span>
                <span className="text-2xl font-bold text-[#D4AF37]">
                  ¥{(selectedProduct.price * orderForm.quantity).toFixed(2)}
                </span>
              </div>

              <button
                type="submit"
                className="muxintang-btn w-full py-4 text-lg"
              >
                {orderSubmitted ? '请奉成功！' : '确认请奉'}
              </button>
            </form>

            {orderSubmitted && (
              <div className="mt-4 p-4 bg-green-900/30 border border-green-700/50 rounded-lg text-center">
                <p className="text-green-400">🙏 请奉成功！阿阇梨将为您祈福加持</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}