'use client';

import { useState } from 'react';

interface PetLiberationProps {
  tenantId?: string;
  onSubmit?: () => void;
}

const LIBERATION_TYPES = [
  { value: 'fish', label: '鱼类放生', icon: '🐟', desc: '放生鱼类，积善积德' },
  { value: 'bird', label: '鸟类放生', icon: '🕊️', desc: '放生鸟类，祈福平安' },
  { value: 'turtle', label: '龟类放生', icon: '🐢', desc: '放生灵龟，延年益寿' },
  { value: 'other', label: '其他', icon: '🦜', desc: '其他生灵放生' },
];

export default function PetLiberation({ tenantId = 'muxintang', onSubmit }: PetLiberationProps) {
  const [formData, setFormData] = useState({
    type: 'fish',
    quantity: 1,
    location: '',
    wish: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    onSubmit?.();
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '延寿', desc: '放生可延寿三年' },
          { label: '消灾', desc: '消除宿世业障' },
          { label: '招财', desc: '积累财富福报' },
          { label: '平安', desc: '家人平安健康' },
        ].map((item) => (
          <div key={item.label} className="bg-[#242424] rounded-lg p-4 text-center">
            <p className="text-[#D4AF37] font-semibold">{item.label}</p>
            <p className="text-xs text-[#808080] mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-[#C0C0C0] mb-3">放生类型</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {LIBERATION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, type: type.value })}
                className={`p-4 rounded-lg border transition-all text-center ${
                  formData.type === type.value
                    ? 'border-[#D4AF37] bg-[#242424]'
                    : 'border-[#333333] bg-[#1a1a1a]'
                }`}
              >
                <span className="text-2xl mb-2 block">{type.icon}</span>
                <p className="text-[#D4AF37] font-medium text-sm">{type.label}</p>
                <p className="text-xs text-[#808080] mt-1">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#C0C0C0] mb-2">放生数量</label>
            <input
              type="number"
              min={1}
              max={999}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              placeholder="请输入数量"
            />
          </div>
          <div>
            <label className="block text-sm text-[#C0C0C0] mb-2">放生地点</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              placeholder="如：西湖、太湖、当地寺庙"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#C0C0C0] mb-2">祈福心愿</label>
          <textarea
            value={formData.wish}
            onChange={(e) => setFormData({ ...formData, wish: e.target.value })}
            rows={3}
            className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
            placeholder="请输入您的祈福心愿（可选）"
          />
        </div>

        <button
          type="submit"
          className="muxintang-btn w-full py-4 text-lg"
        >
          {submitted ? '功德已积累' : '确认放生'}
        </button>
      </form>

      {submitted && (
        <div className="mt-4 p-4 bg-green-900/30 border border-green-700/50 rounded-lg text-center">
          <p className="text-green-400">🙏 放生功德已记录！愿您福寿安康，万事顺遂</p>
        </div>
      )}
    </div>
  );
}