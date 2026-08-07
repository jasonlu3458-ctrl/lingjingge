'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PetLiberationPage() {
  const [formData, setFormData] = useState({
    ownerName: '',
    petName: '',
    wish: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ownerName.trim() || !formData.petName.trim()) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({ ownerName: '', petName: '', wish: '' });
  };

  return (
    <div className="min-h-screen bg-zen-beige py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* —— 页头 —— */}
        <div className="text-center mb-12">
          <h1
            className="text-3xl font-bold mb-4 text-[#2c2c2c]"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            爱宠超度
          </h1>
          <p className="text-[#7a7a7a]">慈悲为怀 · 愿逝去的小灵魂安息往生</p>
        </div>

        {/* —— 祈福文 —— */}
        <div className="bg-white rounded-xl p-8 border border-[#e8e0d0] mb-8">
          <h2
            className="text-xl font-semibold mb-4 text-center text-[#2c2c2c]"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            🪷 祈 福 文
          </h2>
          <div className="text-[#5a5a5a] leading-loose text-center space-y-3">
            <p>
              天地有常，生亦有涯。
              <br />
              曾伴我左右，温热柔软，
              <br />
              今归太虚，愿往生净土，离苦得乐。
            </p>
            <p>
              一灯一香一念心，
              <br />
              回向于此小灵魂，
              <br />
              愿三宝加持，永离轮回，得生善道。
            </p>
            <p className="text-sm text-[#9a9a9a] pt-2">
              —— 牧心堂 · 为爱宠祈福
            </p>
          </div>
        </div>

        {/* —— 登记表单 / 已提交回执 —— */}
        {!submitted ? (
          <div className="bg-white rounded-xl p-8 border border-[#e8e0d0]">
            <h2
              className="text-lg font-semibold mb-2 text-[#2c2c2c]"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            >
              📝 祈福登记
            </h2>
            <p className="text-sm text-[#7a7a7a] mb-6">
              请填写善信与爱宠信息，我们将为您在心中点亮一盏回向之灯
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-[#5a5a5a] mb-2">
                  善信姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full bg-[#faf7f2] border border-[#e8e0d0] rounded-lg px-4 py-3 text-[#2c2c2c] focus:border-amber-400 focus:outline-none transition-colors"
                  placeholder="请输入您的姓名"
                />
              </div>

              <div>
                <label className="block text-sm text-[#5a5a5a] mb-2">
                  爱宠姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.petName}
                  onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                  className="w-full bg-[#faf7f2] border border-[#e8e0d0] rounded-lg px-4 py-3 text-[#2c2c2c] focus:border-amber-400 focus:outline-none transition-colors"
                  placeholder="请输入爱宠的名字"
                />
              </div>

              <div>
                <label className="block text-sm text-[#5a5a5a] mb-2">祈福寄语</label>
                <textarea
                  value={formData.wish}
                  onChange={(e) => setFormData({ ...formData, wish: e.target.value })}
                  rows={4}
                  className="w-full bg-[#faf7f2] border border-[#e8e0d0] rounded-lg px-4 py-3 text-[#2c2c2c] focus:border-amber-400 focus:outline-none transition-colors resize-none"
                  placeholder="写下您对爱宠的思念与祝福（可选）"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-full bg-[#2c2c2c] text-[#f5f0eb] text-base hover:bg-[#1a1a1a] transition-colors"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}
              >
                确认登记祈福
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 border border-[#e8e0d0]">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🪷</div>
              <h2
                className="text-2xl font-semibold mb-2 text-[#2c2c2c]"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                祈福已登记
              </h2>
              <p className="text-sm text-[#7a7a7a]">
                愿 <span className="text-[#2c2c2c] font-medium">{formData.petName}</span> 往生善道，永离轮回
              </p>
            </div>

            <div className="bg-[#faf7f2] rounded-lg p-5 mb-6 space-y-2 text-sm text-[#5a5a5a]">
              <p>
                <span className="text-[#9a9a9a]">善信：</span>
                {formData.ownerName}
              </p>
              <p>
                <span className="text-[#9a9a9a]">爱宠：</span>
                {formData.petName}
              </p>
              {formData.wish && (
                <p>
                  <span className="text-[#9a9a9a]">寄语：</span>
                  {formData.wish}
                </p>
              )}
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-[#5a5a5a] leading-relaxed">
                若您希望为爱宠正式请奉往生牌位，
                <br />
                可前往吉祥馆，由专人协助安置供奉。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/jixiangju?category=祈福超度"
                className="flex-1 py-4 rounded-full bg-amber-600 text-white text-center text-base hover:bg-amber-700 transition-colors"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}
              >
                前往吉祥馆请奉往生牌位
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-4 rounded-full border border-[#d0c8b8] text-[#7a7a7a] text-sm hover:bg-[#faf7f2] transition-all"
              >
                重新登记
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
