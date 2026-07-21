'use client';

import { useState } from 'react';

const DIET_TIPS = [
  { title: '犬类饮食', content: '犬属戌土，宜多食黄色食物如玉米、南瓜，忌过量喂食生冷食物。五行喜火的狗狗可适当喂食辣椒、生姜等温热食材。' },
  { title: '猫类饮食', content: '猫属寅木，宜多食绿色食物如蔬菜、猫草，忌喂食过多肝脏类食物。五行喜水的猫咪可适当喂食鱼类。' },
  { title: '鸟类饮食', content: '鸟类属火，宜多食红色食物如胡萝卜、樱桃，忌喂食油腻食物。注意保持饮水清洁。' },
  { title: '鱼类饮食', content: '鱼类属水，宜多食清淡食物，忌喂食油性过大的饲料。保持水质清洁是关键。' },
];

const FEEDING_SCHEDULE = [
  { time: '辰时 (7-9点)', desc: '喂食早餐，此时脾胃运化最佳' },
  { time: '午时 (11-13点)', desc: '可少量加餐，补充能量' },
  { time: '申时 (15-17点)', desc: '喂食晚餐，量宜适中' },
  { time: '戌时 (19-21点)', desc: '不宜喂食，以免影响消化' },
];

export default function PetDietPage() {
  const [petType, setPetType] = useState('dog');

  const petTypes = [
    { value: 'dog', label: '🐕 犬类' },
    { value: 'cat', label: '🐱 猫类' },
    { value: 'bird', label: '🐦 鸟类' },
    { value: 'fish', label: '🐟 鱼类' },
    { value: 'other', label: '🐢 其他' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            饮食调理
          </h1>
          <p className="text-[#808080]">科学喂养，健康成长，根据五行命理调理宠物饮食</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {petTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setPetType(type.value)}
              className={`px-6 py-2 rounded-full border transition-all ${
                petType === type.value
                  ? 'border-[#D4AF37] bg-[#8B4513] text-[#D4AF37]'
                  : 'border-[#333333] text-[#808080] hover:border-[#D4AF37]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {DIET_TIPS.map((tip) => (
            <div key={tip.title} className="muxintang-card p-6">
              <h3 
                className="text-lg font-semibold mb-3"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
              >
                {tip.title}
              </h3>
              <p className="text-[#C0C0C0] text-sm leading-relaxed">
                {tip.content}
              </p>
            </div>
          ))}
        </div>

        <div className="muxintang-card p-8">
          <h2 
            className="text-xl font-semibold mb-6"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            ⏰ 时辰喂食法
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEEDING_SCHEDULE.map((item) => (
              <div key={item.time} className="bg-[#242424] rounded-lg p-4 text-center">
                <p className="text-[#D4AF37] font-semibold text-sm">{item.time}</p>
                <p className="text-xs text-[#808080] mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 muxintang-card p-8">
          <h2 
            className="text-xl font-semibold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            🧪 饮食宜忌
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[#D4AF37] font-medium mb-3">✅ 宜食</h3>
              <ul className="space-y-2">
                {['新鲜肉类', '蔬菜杂粮', '适量水果', '干净饮水'].map((item) => (
                  <li key={item} className="text-[#C0C0C0] text-sm flex items-center gap-2">
                    <span>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-red-400 font-medium mb-3">❌ 忌食</h3>
              <ul className="space-y-2">
                {['巧克力', '洋葱大蒜', '葡萄葡萄干', '过量盐分', '生肉生蛋'].map((item) => (
                  <li key={item} className="text-[#C0C0C0] text-sm flex items-center gap-2">
                    <span>✕</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}