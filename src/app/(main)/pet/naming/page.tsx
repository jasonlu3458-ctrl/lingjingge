'use client';

import { useState } from 'react';

export default function PetNamingPage() {
  const [formData, setFormData] = useState({
    petType: 'dog',
    gender: 'male',
    birthDate: '',
    ownerWish: '',
  });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
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
        setError(data.error || '起名失败，请稍后重试');
      }
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zen-beige py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* —— 页头 —— */}
        <div className="text-center mb-12">
          <h1
            className="text-3xl font-bold mb-4 text-[#2c2c2c]"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            爱宠起名
          </h1>
          <p className="text-[#7a7a7a]">为萌宠赐名 · 福泽相伴，名正则运顺</p>
        </div>

        {/* —— 起名表单 —— */}
        <div className="bg-white rounded-xl p-8 border border-[#e8e0d0]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#5a5a5a] mb-2">宠物类型</label>
                <select
                  value={formData.petType}
                  onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                  className="w-full bg-[#faf7f2] border border-[#e8e0d0] rounded-lg px-4 py-3 text-[#2c2c2c] focus:border-amber-400 focus:outline-none transition-colors"
                >
                  <option value="dog">🐕 狗狗</option>
                  <option value="cat">🐱 猫咪</option>
                  <option value="bird">🐦 鸟类</option>
                  <option value="fish">🐠 鱼类</option>
                  <option value="other">🐾 其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#5a5a5a] mb-2">性别</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-[#faf7f2] border border-[#e8e0d0] rounded-lg px-4 py-3 text-[#2c2c2c] focus:border-amber-400 focus:outline-none transition-colors"
                >
                  <option value="male">公</option>
                  <option value="female">母</option>
                  <option value="unknown">未知</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#5a5a5a] mb-2">出生日期</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full bg-[#faf7f2] border border-[#e8e0d0] rounded-lg px-4 py-3 text-[#2c2c2c] focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-[#5a5a5a] mb-2">主人期望</label>
              <textarea
                value={formData.ownerWish}
                onChange={(e) => setFormData({ ...formData, ownerWish: e.target.value })}
                className="w-full bg-[#faf7f2] border border-[#e8e0d0] rounded-lg px-4 py-3 text-[#2c2c2c] focus:border-amber-400 focus:outline-none transition-colors resize-none"
                rows={3}
                placeholder="例如：希望名字可爱、吉祥，带财运..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-[#2c2c2c] text-[#f5f0eb] text-base hover:bg-[#1a1a1a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}
            >
              {loading ? '起名中...' : '为爱宠赐名'}
            </button>
          </form>

          {/* —— 错误提示 —— */}
          {error && (
            <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {/* —— 起名结果 —— */}
          {result && (
            <div className="mt-8 p-6 rounded-lg bg-[#faf7f2] border border-amber-200">
              <h3
                className="text-lg font-semibold mb-4 text-[#2c2c2c]"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                ✦ 推荐名字
              </h3>
              <div className="text-[#5a5a5a] whitespace-pre-wrap leading-relaxed">
                {result}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[#9a9a9a] text-sm">
            本服务仅供娱乐参考，不构成专业建议
          </p>
        </div>
      </div>
    </div>
  );
}
