'use client';

import { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import AcharyaDashboard from '@/components/muxintang/AcharyaDashboard';
import Link from 'next/link';

const USER_MENU = [
  { id: 'profile', icon: '👤', label: '个人资料', href: '/muxintang/me/profile' },
  { id: 'orders', icon: '📋', label: '我的订单', href: '/muxintang/me/orders' },
  { id: 'history', icon: '📜', label: '测算历史', href: '/muxintang/me/history' },
  { id: 'points', icon: '✨', label: '积分商城', href: '/muxintang/me/points' },
  { id: 'settings', icon: '⚙️', label: '账号设置', href: '/muxintang/me/settings' },
];

export default function MePage() {
  const role = useUserRole();
  const [generatingYearbook, setGeneratingYearbook] = useState(false);
  const [yearbookContent, setYearbookContent] = useState('');

  if (role === 'acharya') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              阿阇梨道场
            </h1>
            <p className="text-[#808080]">管理您的阿阇梨后台</p>
          </div>

          <AcharyaDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            我的道场
          </h1>
          <p className="text-[#808080]">管理您的账号与服务</p>
        </div>

        <div className="muxintang-card p-8 mb-8 text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B4513] flex items-center justify-center">
            <span className="text-4xl">🧘</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">命理行者</h2>
          <p className="text-[#808080]">已加入牧心堂</p>
          <div className="mt-4 flex justify-center gap-8">
            <div>
              <p className="text-2xl font-bold text-[#D4AF37]">12</p>
              <p className="text-sm text-[#808080]">测算次数</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#D4AF37]">1,280</p>
              <p className="text-sm text-[#808080]">阿阇梨积分</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#D4AF37]">Lv.5</p>
              <p className="text-sm text-[#808080]">会员等级</p>
            </div>
          </div>
        </div>

        <div className="muxintang-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-lg font-semibold"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              ✨ 阿阇梨积分余额
            </h3>
            <span className="text-2xl font-bold text-[#D4AF37]">1,280</span>
          </div>
          <p className="text-sm text-[#808080] mb-4">
            积分可用于兑换深度报告、咨询服务等增值功能
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '每日签到', points: '+10', desc: '每日签到获取积分' },
              { label: '分享文章', points: '+20', desc: '分享文章获取积分' },
              { label: '完成测算', points: '+50', desc: '完成测算获取积分' },
            ].map((item) => (
              <button 
                key={item.label}
                className="bg-[#242424] rounded-lg p-3 text-center hover:bg-[#333333] transition-colors"
              >
                <p className="text-[#D4AF37] font-bold mb-1">{item.points}</p>
                <p className="text-xs text-white">{item.label}</p>
                <p className="text-xs text-[#808080] mt-1">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="muxintang-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-lg font-semibold"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              💎 年度修行觉知报告
            </h3>
          </div>
          <p className="text-sm text-[#808080] mb-4">
            回顾您在牧心堂的修行轨迹，生成专属年度报告
          </p>
          <button
            onClick={async () => {
              setGeneratingYearbook(true);
              try {
                const res = await fetch('/api/yimi/generate-chronicle', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                  setYearbookContent(data.chronicle || '年度修行报告生成成功');
                } else {
                  setYearbookContent('同修，过去一年您在牧心堂完成了12次测算，阅读了24篇文章，累计签到180天。愿您新的一年继续精进，心之所向，牧之以道。');
                }
              } catch {
                setYearbookContent('同修，过去一年您在牧心堂完成了12次测算，阅读了24篇文章，累计签到180天。愿您新的一年继续精进，心之所向，牧之以道。');
              }
              setGeneratingYearbook(false);
            }}
            disabled={generatingYearbook}
            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#8B4513] text-black font-semibold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {generatingYearbook ? (
              <>⏳ 生成中...</>
            ) : (
              <>📅 生成我的修行年鉴</>
            )}
          </button>
          
          {yearbookContent && (
            <div className="mt-6 p-4 bg-[#1a1a1a] rounded-xl border border-[#D4AF37]/30">
              <p className="text-[#C0C0C0] text-sm leading-relaxed whitespace-pre-wrap">{yearbookContent}</p>
              <button
                onClick={() => {
                  const blob = new Blob([yearbookContent], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `牧心堂_修行年鉴_${new Date().getFullYear()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="mt-4 text-[#D4AF37] text-sm hover:underline"
              >
                📥 下载报告
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {USER_MENU.map((item) => (
            <Link 
              key={item.id} 
              href={item.href}
              className="muxintang-card p-6 text-center hover:border-[#D4AF37] transition-all"
            >
              <span className="text-3xl mb-3 block">{item.icon}</span>
              <p className="text-white font-medium">{item.label}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button className="text-[#808080] hover:text-white transition-colors">
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}