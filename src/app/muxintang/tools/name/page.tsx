'use client';

import { useState } from 'react';

export default function NameToolPage() {
  const [formData, setFormData] = useState({
    type: 'baby',
    gender: 'male',
    birthDate: '',
    expectations: '',
  });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/muxintang/api/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResult(data.success ? data.result : '起名失败，请稍后重试');
    } catch {
      setResult('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const types = [
    { value: 'baby', label: '宝宝起名' },
    { value: 'personal', label: '成人改名' },
    { value: 'company', label: '公司命名' },
    { value: 'brand', label: '品牌起名' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            起名改名
          </h1>
          <p className="text-[#808080]">赐名吉祥如意，开启美好篇章</p>
        </div>

        <div className="muxintang-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-[#C0C0C0] mb-2">起名类型</label>
              <div className="grid grid-cols-2 gap-2">
                {types.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t.value })}
                    className={`py-3 rounded-lg transition-all ${
                      formData.type === t.value
                        ? 'bg-[#8B4513] text-white'
                        : 'bg-[#242424] text-[#808080] border border-[#333333]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.type !== 'company' && formData.type !== 'brand' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#C0C0C0] mb-2">性别</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#C0C0C0] mb-2">出生日期</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-[#C0C0C0] mb-2">期望与要求</label>
              <textarea
                value={formData.expectations}
                onChange={(e) => setFormData({ ...formData, expectations: e.target.value })}
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                rows={4}
                placeholder="例如：希望名字文雅、有内涵，带财运..."
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="muxintang-btn w-full py-4 text-lg"
            >
              {loading ? '起名中...' : '开始起名'}
            </button>
          </form>

          {result && (
            <div className="mt-8 p-6 bg-[#242424] rounded-lg border border-[#333333]">
              <h3 
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
              >
                推荐名字
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
