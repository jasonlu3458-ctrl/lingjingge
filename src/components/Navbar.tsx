'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UserStatus from './UserStatus';

// 导航菜单数据结构
const menuItems = [
  {
    label: '问道',
    href: '/wen/chan/ai-zen-master',
    items: [
      {
        label: '禅修系列',
        subItems: [
          { label: 'AI禅师', href: '/wen/chan/ai-zen-master', icon: '🧘' },
          { label: '公案参究', href: '/wen/chan/gongan', icon: '📿' },
          { label: '觉醒日记', href: '/wen/chan/awakening', icon: '🌅' },
        ]
      },
      {
        label: '疗愈系列',
        subItems: [
          { label: 'AI疗愈师', href: '/wen/liao/mind', icon: '💚' },
          { label: '身心疗愈', href: '/wen/liao/healing', icon: '🌸' },
          { label: 'AI亲子导师', href: '/wen/liao/parenting', icon: '👨‍👩‍👧' },
        ]
      },
      {
        label: '易理系列',
        subItems: [
          { label: 'AI易理师', href: '/wen/yi/yili', icon: '☯️' },
        ]
      },
    ]
  },
  {
    label: '观我',
    href: '/guan/mingli',
    items: [
      {
        label: '观我系列',
        subItems: [
          { label: 'AI生命密码', href: '/guan/mingli', icon: '🔮' },
          { label: 'AI取名轩', href: '/guan/name', icon: '📝' },
          { label: 'AI炼体师', href: '/guan/tili', icon: '💪' },
          { label: 'AI体质观察', href: '/guan/health', icon: '🌿' },
          { label: '照见前尘', href: '/guan/pastlife', icon: '✨' },
        ]
      },
    ]
  },
  {
    label: '藏经',
    href: '/zang/library',
    items: [
      {
        label: '藏经系列',
        subItems: [
          { label: '藏经阁', href: '/zang/library', icon: '📚' },
          { label: '正念冥想', href: '/zang/meditation', icon: '🧘‍♂️' },
          { label: '法脉源流', href: '/zang/lineage', icon: '📜' },
        ]
      },
    ]
  },
  {
    label: '同修',
    href: '/tong/community',
    items: [
      {
            label: '社区系列',
            subItems: [
              { label: '同修社区', href: '/tong/community', icon: '🤝' },
              { label: '个人中心', href: '/tong/profile', icon: '🏠' },
              { label: '会员订阅', href: '/tong/pricing', icon: '💎' },
            ]
          },
    ]
  },
];

export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <nav className="bg-zen-beige border-b border-zen-gray sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/home" className="flex items-center gap-2 group">
              <Image 
                src="/images/logo.png" 
                alt="灵境阁" 
                width={40} 
                height={40} 
                className="rounded-full transition-transform duration-300 group-hover:scale-105" 
              />
              <span className="text-xl font-serif text-[#2c2c2c] hidden sm:inline" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                灵境阁
              </span>
            </Link>
          </div>
          
          {/* 导航菜单 - 桌面端 */}
          <div className="hidden lg:flex gap-2 items-center">
            {menuItems.map((menu) => (
              <div
                key={menu.label}
                className="relative h-16 flex items-center"
                onMouseEnter={() => setActiveMenu(menu.label)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                {/* 主菜单按钮 */}
                <Link
                  href={menu.href}
                  className="px-6 py-2.5 rounded-[20px] font-medium transition-all duration-300 flex items-center gap-2"
                  style={{
                    backgroundColor: activeMenu === menu.label ? '#2c2c2c' : 'transparent',
                    color: activeMenu === menu.label ? '#f5f0eb' : '#2c2c2c',
                    border: '1px solid #2c2c2c',
                    fontFamily: "'Ma Shan Zheng', cursive, serif",
                    letterSpacing: '2px',
                    fontSize: '15px',
                  }}
                >
                  {menu.label}
                  <span style={{
                    transform: activeMenu === menu.label ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                    fontSize: '10px',
                  }}>
                    ▼
                  </span>
                </Link>

                {/* 下拉子菜单 */}
                {activeMenu === menu.label && (
                  <div
                    className="absolute top-full left-0 mt-0 bg-white rounded-lg shadow-lg border border-gray-200 py-4"
                    style={{
                      animation: 'fadeIn 0.2s ease-in-out',
                      minWidth: '280px',
                    }}
                  >
                    {menu.items.map((category) => (
                      <div key={category.label} className="mb-3 last:mb-0">
                        <div
                          className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                          style={{
                            fontFamily: "'Ma Shan Zheng', cursive, serif",
                            letterSpacing: '1px',
                          }}
                        >
                          {category.label}
                        </div>
                        {category.subItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 mx-2 rounded"
                            style={{
                              fontFamily: "'Ma Shan Zheng', cursive, serif",
                              letterSpacing: '1px',
                            }}
                            onClick={() => setActiveMenu(null)}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* AI灵光 - 脉冲指示器 */}
            <div 
              aria-label="AI在线指示器"
              className="ml-5"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#2c2c2c',
                boxShadow: '0 0 8px rgba(44, 44, 44, 0.4)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          </div>

          {/* 用户状态 */}
          <div className="hidden lg:flex items-center">
            <UserStatus />
          </div>
        </div>
      </div>

      {/* AI灵光脉冲动画样式 */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  );
}
