'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PetNamingPage() {
  const [formData, setFormData] = useState({
    petName: '',
    petType: 'dog',
    gender: 'male',
    birthDate: '',
    ownerWish: '',
  });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/muxintang/api/pet/naming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
      } else {
        setResult('起名失败，请稍后重试');
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
            宠物起名
          </h1>
          <p className="text-[#808080]">为萌宠赐名，福泽相伴</p>
        </div>

        <div className="muxintang-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">宠物类型</label>
                <select
                  value={formData.petType}
                  onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                >
                  <option value="dog">🐕 狗狗</option>
                  <option value="cat">🐱 猫咪</option>
                  <option value="bird">🐦 鸟类</option>
                  <option value="fish">🐠 鱼类</option>
                  <option value="other">🐾 其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">性别</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                >
                  <option value="male">公</option>
                  <option value="female">母</option>
                  <option value="unknown">未知</option>
                </select>
              </div>
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

            <div>
              <label className="block text-sm text-[#C0C0C0] mb-2">主人期望</label>
              <textarea
                value={formData.ownerWish}
                onChange={(e) => setFormData({ ...formData, ownerWish: e.target.value })}
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                rows={3}
                placeholder="例如：希望名字可爱、吉祥，带财运..."
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="muxintang-btn w-full py-4 text-lg"
            >
              {loading ? '起名中...' : '为宠物赐名'}
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

        <div className="mt-8 text-center">
          <p className="text-[#808080] text-sm">
            本服务仅供娱乐参考，不构成专业建议
          </p>
        </div>
      </div>
    </div>
  );
}
