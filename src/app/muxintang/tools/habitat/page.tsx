'use client';

import { useState } from 'react';

export default function HabitatToolPage() {
  const [formData, setFormData] = useState({
    houseType: 'apartment',
    direction: '',
    layout: '',
  });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/muxintang/api/habitat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResult(data.success ? data.result : '分析失败，请稍后重试');
    } catch {
      setResult('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            家居环境
          </h1>
          <p className="text-[#808080]">优化空间能量，营造和谐气场</p>
        </div>

        <div className="muxintang-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-[#C0C0C0] mb-2">房屋类型</label>
              <select
                value={formData.houseType}
                onChange={(e) => setFormData({ ...formData, houseType: e.target.value })}
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              >
                <option value="apartment">公寓</option>
                <option value="villa">别墅</option>
                <option value="office">办公室</option>
                <option value="shop">商铺</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#C0C0C0] mb-2">朝向</label>
              <select
                value={formData.direction}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              >
                <option value="">选择朝向</option>
                <option value="north">坐北朝南</option>
                <option value="south">坐南朝北</option>
                <option value="east">坐东朝西</option>
                <option value="west">坐西朝东</option>
                <option value="northeast">坐东北朝西南</option>
                <option value="southeast">坐东南朝西北</option>
                <option value="northwest">坐西北朝东南</option>
                <option value="southwest">坐西南朝东北</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#C0C0C0] mb-2">户型描述</label>
              <textarea
                value={formData.layout}
                onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                rows={4}
                placeholder="请简要描述户型特点，如：三室两厅、南北通透、客厅朝南..."
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="muxintang-btn w-full py-4 text-lg"
            >
              {loading ? '分析中...' : '开始分析'}
            </button>
          </form>

          {result && (
            <div className="mt-8 p-6 bg-[#242424] rounded-lg border border-[#333333]">
              <h3 
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
              >
                环境分析
              </h3>
              <div className="text-[#C0C0C0] whitespace-pre-wrap leading-relaxed">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
