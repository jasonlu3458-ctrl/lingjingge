'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getToolConfig } from '@/lib/tool-configs';
import XuanReportCard, { type ReportSection } from '@/components/xuan/XuanReportCard';

const TOOL_CFG = getToolConfig('bazi');

const HOURS = [
  { v: '', l: '选择时辰' },
  { v: '0', l: '子时 (23-01)' }, { v: '1', l: '丑时 (01-03)' },
  { v: '2', l: '寅时 (03-05)' }, { v: '3', l: '卯时 (05-07)' },
  { v: '4', l: '辰时 (07-09)' }, { v: '5', l: '巳时 (09-11)' },
  { v: '6', l: '午时 (11-13)' }, { v: '7', l: '未时 (13-15)' },
  { v: '8', l: '申时 (15-17)' }, { v: '9', l: '酉时 (17-19)' },
  { v: '10', l: '戌时 (19-21)' }, { v: '11', l: '亥时 (21-23)' },
];

/**
 * muxintang/tools/bazi 接入 XuanReportCard 示范
 *
 * 保留：原有 form + /muxintang/api/bazi endpoint
 * 改造：报告渲染从 <pre> 改为 <XuanReportCard>（带分节/分享/对话入口）
 */
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

  // 把 result 字符串按 [标题] 或 段落 拆为 ReportSection
  const sections: ReportSection[] = result
    ? result
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => {
          // 匹配 [标题] 或 【标题】
          const m = p.match(/^[【\[](.+?)[】\]]\s*([\s\S]*)/);
          if (m) {
            return { title: m[1], content: m[2].trim(), variant: i === 0 ? 'highlight' as const : 'plain' as const };
          }
          return { title: `第 ${i + 1} 段`, content: p, variant: 'plain' as const };
        })
    : [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            {TOOL_CFG?.titleMuxintang ?? '生命代码'}
          </h1>
          <p className="text-[#808080]">洞见天赋底色，读懂人生节律</p>
          <p className="text-[#D4AF37] mt-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            {TOOL_CFG?.hint ?? '请提供您的出生年月日时，阿阇梨为您解读天赋与节律。'}
          </p>
        </div>

        {!result ? (
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
                    {HOURS.map((h) => (
                      <option key={h.v} value={h.v}>{h.l}</option>
                    ))}
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
          </div>
        ) : (
          <XuanReportCard
            title="八字命理解读"
            subtitle={`基于 ${formData.year}-${formData.month}-${formData.day} ${HOURS.find((h) => h.v === formData.hour)?.l ?? ''}`}
            icon="🪷"
            themeColor="#D4AF37"
            generatedAt={new Date().toLocaleString('zh-CN', { hour12: false })}
            sections={sections}
            onBack={() => setResult(null)}
            onRetry={() => setResult(null)}
          />
        )}

        <div className="text-center mt-8">
          <Link
            href="/muxintang"
            className="text-[#808080] hover:text-[#D4AF37] transition-colors text-sm"
          >
            ← 返回牧心堂
          </Link>
        </div>
      </div>
    </div>
  );
}
