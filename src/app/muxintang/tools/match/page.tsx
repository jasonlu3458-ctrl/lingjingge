'use client';

import { useState } from 'react';

export default function MatchToolPage() {
  const [formData, setFormData] = useState({
    person1Name: '',
    person1Gender: 'male',
    person1BirthDate: '',
    person2Name: '',
    person2Gender: 'female',
    person2BirthDate: '',
  });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/muxintang/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResult(data.success ? data.result : '测算失败，请稍后重试');
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
            缘分合婚
          </h1>
          <p className="text-[#808080]">测算姻缘匹配，携手幸福人生</p>
        </div>

        <div className="muxintang-card p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 
                className="text-lg font-semibold mb-6"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
              >
                男方信息
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  value={formData.person1Name}
                  onChange={(e) => setFormData({ ...formData, person1Name: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="姓名"
                />
                <select
                  value={formData.person1Gender}
                  onChange={(e) => setFormData({ ...formData, person1Gender: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                >
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
                <input
                  type="date"
                  value={formData.person1BirthDate}
                  onChange={(e) => setFormData({ ...formData, person1BirthDate: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="出生日期"
                />
              </div>
            </div>

            <div>
              <h2 
                className="text-lg font-semibold mb-6"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
              >
                女方信息
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  value={formData.person2Name}
                  onChange={(e) => setFormData({ ...formData, person2Name: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="姓名"
                />
                <select
                  value={formData.person2Gender}
                  onChange={(e) => setFormData({ ...formData, person2Gender: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                >
                  <option value="female">女</option>
                  <option value="male">男</option>
                </select>
                <input
                  type="date"
                  value={formData.person2BirthDate}
                  onChange={(e) => setFormData({ ...formData, person2BirthDate: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="出生日期"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            onClick={handleSubmit}
            disabled={loading}
            className="muxintang-btn w-full py-4 text-lg mt-8"
          >
            {loading ? '测算中...' : '开始测算'}
          </button>

          {result && (
            <div className="mt-8 p-6 bg-[#242424] rounded-lg border border-[#333333]">
              <h3 
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
              >
                合婚结果
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
