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
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* —— 页头 —— */}
        <div className="text-center mb-12">
          <h1
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            爱宠超度
          </h1>
          <p className="text-[#808080]">慈悲为怀 · 愿逝去的小灵魂安息往生</p>
        </div>

        {/* —— 祈福文 —— */}
        <div className="muxintang-card p-8 mb-8">
          <h2
            className="text-xl font-semibold mb-4 text-center"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            🪷 祈 福 文
          </h2>
          <div className="text-[#C0C0C0] leading-loose text-center space-y-3">
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
            <p className="text-sm text-[#808080] pt-2">
              —— 牧心堂 · 为爱宠祈福
            </p>
          </div>
        </div>

        {/* —— 登记表单 / 已提交回执 —— */}
        {!submitted ? (
          <div className="muxintang-card p-8">
            <h2
              className="text-lg font-semibold mb-2"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              📝 祈福登记
            </h2>
            <p className="text-sm text-[#808080] mb-6">
              请填写善信与爱宠信息，我们将为您在心中点亮一盏回向之灯
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">
                  善信姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="请输入您的姓名"
                />
              </div>

              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">
                  爱宠姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.petName}
                  onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                  placeholder="请输入爱宠的名字"
                />
              </div>

              <div>
                <label className="block text-sm text-[#C0C0C0] mb-2">祈福寄语</label>
                <textarea
                  value={formData.wish}
                  onChange={(e) => setFormData({ ...formData, wish: e.target.value })}
                  rows={4}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                  placeholder="写下您对爱宠的思念与祝福（可选）"
                />
              </div>

              <button
                type="submit"
                className="muxintang-btn w-full py-4 text-lg"
                style={{ letterSpacing: '2px' }}
              >
                确认登记祈福
              </button>
            </form>
          </div>
        ) : (
          <div className="muxintang-card p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🪷</div>
              <h2
                className="text-2xl font-semibold mb-2"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
              >
                祈福已登记
              </h2>
              <p className="text-sm text-[#808080]">
                愿 <span className="text-[#D4AF37] font-medium">{formData.petName}</span> 往生善道，永离轮回
              </p>
            </div>

            <div className="bg-[#242424] rounded-lg p-5 mb-6 space-y-2 text-sm text-[#C0C0C0]">
              <p>
                <span className="text-[#808080]">善信：</span>
                {formData.ownerName}
              </p>
              <p>
                <span className="text-[#808080]">爱宠：</span>
                {formData.petName}
              </p>
              {formData.wish && (
                <p>
                  <span className="text-[#808080]">寄语：</span>
                  {formData.wish}
                </p>
              )}
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-[#C0C0C0] leading-relaxed">
                若您希望为爱宠正式请奉往生牌位，
                <br />
                可前往吉祥馆，由专人协助安置供奉。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/muxintang/jixiangju?category=祈福超度"
                className="flex-1 py-4 rounded-full bg-[#D4AF37] text-[#1a1a1a] text-center text-base hover:bg-[#E5C158] transition-colors"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}
              >
                前往吉祥馆请奉往生牌位
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-4 rounded-full border border-[#333333] text-[#808080] text-sm hover:bg-[#242424] transition-all"
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
