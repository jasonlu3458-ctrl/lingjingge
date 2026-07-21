'use client';

import { useState } from 'react';

const ACCESSORIES = [
  { id: 'collar', name: '吉祥项圈', icon: '🐕', price: 88, desc: '刻有吉祥图案的宠物项圈，可辟邪保平安' },
  { id: 'tag', name: '身份牌', icon: '🏷️', price: 58, desc: '刻有宠物名字和主人联系方式的金属身份牌' },
  { id: 'bed', name: '风水窝垫', icon: '🛏️', price: 168, desc: '根据五行命理设计的宠物窝垫，助宠物健康成长' },
  { id: 'toy', name: '益智玩具', icon: '🎾', price: 38, desc: '帮助宠物锻炼智力的益智玩具' },
  { id: 'clothing', name: '吉祥服饰', icon: '👕', price: 98, desc: '印有吉祥图案的宠物服饰' },
  { id: 'bowl', name: '招财食盆', icon: '🥣', price: 68, desc: '聚宝盆造型的宠物食盆，寓意招财进宝' },
];

export default function PetAccessoriesPage() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  const totalPrice = Array.from(selectedItems).reduce((sum, id) => {
    const item = ACCESSORIES.find((a) => a.id === id);
    return sum + (item?.price || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            吉祥饰品
          </h1>
          <p className="text-[#808080]">为您的爱宠佩戴祥瑞，平安喜乐常相伴</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {ACCESSORIES.map((item) => (
            <div
              key={item.id}
              className={`muxintang-card p-6 cursor-pointer transition-all ${
                selectedItems.has(item.id) ? 'border-[#D4AF37] bg-[#242424]' : 'hover:border-[#D4AF37]'
              }`}
              onClick={() => toggleItem(item.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{item.icon}</span>
                {selectedItems.has(item.id) && (
                  <span className="text-[#D4AF37]">✓</span>
                )}
              </div>
              <h3 
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
              >
                {item.name}
              </h3>
              <p className="text-sm text-[#808080] mb-4">{item.desc}</p>
              <p className="text-[#D4AF37] font-bold">¥{item.price}</p>
            </div>
          ))}
        </div>

        {selectedItems.size > 0 && (
          <div className="mt-8 fixed bottom-20 left-0 right-0 md:static md:max-w-6xl md:mx-auto px-4">
            <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-[#C0C0C0]">已选 {selectedItems.size} 件商品</p>
                <p className="text-[#D4AF37] text-xl font-bold">总计 ¥{totalPrice}</p>
              </div>
              <button className="muxintang-btn px-8 py-3">
                立即购买
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}