'use client';

import { useState } from 'react';

export default function ChooseDayToolPage() {
  const [formData, setFormData] = useState({
    purpose: 'wedding',
    year: '',
    month: '',
    day: '',
  });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/muxintang/api/chooseday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResult(data.success ? data.result : '择日失败，请稍后重试');
    } catch {
      setResult('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const purposes = [
    { value: 'wedding', label: '婚礼庆典' },
    { value: 'opening', label: '开业开张' },
    { value: 'move', label: '搬家乔迁' },
    { value: 'travel', label: '出行远行' },
    { value: 'medical', label: '就医问诊' },
    { value: 'other', label: '其他事项' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            择日吉时
          </h1>
          <p className="text-[#808080]">精选良辰吉日，助您万事如意</p>
          <p className="text-[#D4AF37] mt-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            根据天干地支、黄道吉日、冲煞生肖等择日古法，为您挑选最佳时辰。
          </p>
        </div>

        <div className="muxintang-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-[#C0C0C0] mb-2">择日目的</label>
              <div className="grid grid-cols-3 gap-2">
                {purposes.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, purpose: p.value })}
                    className={`py-3 rounded-lg transition-all ${
                      formData.purpose === p.value
                        ? 'bg-[#8B4513] text-white'
                        : 'bg-[#242424] text-[#808080] border border-[#333333]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">年</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="2024"
                />
              </div>
              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">月</label>
                <input
                  type="number"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="1-12"
                />
              </div>
              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">日</label>
                <input
                  type="number"
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="1-31"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="muxintang-btn w-full py-4 text-lg"
            >
              {loading ? '择日中...' : '查看吉日'}
            </button>
          </form>

          {result && (
            <div className="mt-8 p-6 bg-[#242424] rounded-lg border border-[#333333]">
              <h3 
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
              >
                择日结果
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
