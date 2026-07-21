'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BaziToolPage() {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    year: '',
    month: '',
    day: '',
    hour: '',
  });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/muxintang/api/bazi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
      } else {
        setResult('测算失败，请稍后重试');
      }
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
            八字智测
          </h1>
          <p className="text-[#808080]">揭秘命理玄机，洞察人生走向</p>
          <p className="text-[#D4AF37] mt-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            请提供您的出生年月日时，阿阇梨为您推演大运流年。
          </p>
        </div>

        <div className="muxintang-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="请输入姓名"
                />
              </div>
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
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">年</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="1990"
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
              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">时</label>
                <select
                  value={formData.hour}
                  onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                >
                  <option value="">选择时辰</option>
                  <option value="0">子时 (23-01)</option>
                  <option value="1">丑时 (01-03)</option>
                  <option value="2">寅时 (03-05)</option>
                  <option value="3">卯时 (05-07)</option>
                  <option value="4">辰时 (07-09)</option>
                  <option value="5">巳时 (09-11)</option>
                  <option value="6">午时 (11-13)</option>
                  <option value="7">未时 (13-15)</option>
                  <option value="8">申时 (15-17)</option>
                  <option value="9">酉时 (17-19)</option>
                  <option value="10">戌时 (19-21)</option>
                  <option value="11">亥时 (21-23)</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="muxintang-btn w-full py-4 text-lg"
            >
              {loading ? '测算中...' : '开始测算'}
            </button>
          </form>

          {result && (
            <div className="mt-8 p-6 bg-[#242424] rounded-lg border border-[#333333]">
              <h3 
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
              >
                测算结果
              </h3>
              <div className="text-[#C0C0C0] whitespace-pre-wrap leading-relaxed">
                {result}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[#808080] text-sm">
            本测算仅供娱乐参考，不构成专业建议
          </p>
        </div>
      </div>
    </div>
  );
}
