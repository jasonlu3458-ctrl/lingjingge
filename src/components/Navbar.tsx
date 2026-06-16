'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UserStatus from './UserStatus';

// 导航菜单数据结构
const menuItems = [
  {
    label: '解惑',
    href: '/wen',
    items: [
      { label: 'AI轻解忧', href: '/wen/light-solution', icon: '�' },
      { label: 'AI易理师', href: '/wen/yi/yili', icon: '☯️' },
      { label: 'AI疗愈师', href: '/wen/liao/mind', icon: '💚' },
      { label: 'AI禅师',   href: '/wen/chan/ai-zen-master', icon: '🧘' },
    ]
  },
  {
    label: '内观',
    href: '/guan',
    items: [
      { label: 'AI生命密码', href: '/guan/mingli',     icon: '🔮' },
      { label: 'AI婚姻家庭', href: '/guan/family',     icon: '�' },
      { label: 'AI事业财富', href: '/guan/career',     icon: '�' },
      { label: 'AI子女教育', href: '/guan/education',  icon: '🌱' },
      { label: 'AI家居环境', href: '/guan/house',      icon: '�' },
      { label: 'AI身心合一', href: '/guan/body',       icon: '🌿' },
    ]
  },
  {
    label: '藏经',
    href: '/zang',
    items: [
      { label: '藏经阁',   href: '/zang/library', icon: '📚' },
      { label: '术语百科', href: '/zang/terms',   icon: '📖' },
      { label: '法脉源流', href: '/zang/lineage', icon: '📜' },
    ]
  },
  {
    label: '同修',
    href: '/tong/community',
    items: [
      { label: '社区',     href: '/tong/community',  icon: '🤝' },
      { label: '每日话题', href: '/tong/daily-topic', icon: '☀️' },
      { label: '个人中心', href: '/tong/profile',    icon: '🏠' },
      { label: '会员订阅', href: '/tong/pricing',    icon: '💎' },
      { label: '邀请好友', href: '/tong/invite',     icon: '🎁' },
    ]
  },
];

export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // 用于延迟关闭菜单的定时器
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 缓存菜单切换函数
  const handleMenuEnter = useCallback((label: string) => {
    // 清除待执行的关闭定时器（鼠标重新进入时取消关闭）
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveMenu(label);
  }, []);

  const handleMenuLeave = useCallback(() => {
    // 延迟 150ms 关闭，给鼠标移到下拉菜单留出时间
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setActiveMenu(null);
      closeTimerRef.current = null;
    }, 150);
  }, []);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('nav')) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC键关闭移动端菜单
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setActiveMenu(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <nav className="bg-zen-beige border-b border-zen-gray sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/home" prefetch={true} className="flex items-center gap-2 group">
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
                onMouseEnter={() => handleMenuEnter(menu.label)}
                onMouseLeave={handleMenuLeave}
                onFocus={() => handleMenuEnter(menu.label)}
                onBlur={handleMenuLeave}
              >
                {/* 主菜单按钮 */}
                <Link
                  href={menu.href}
                  prefetch={true}
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
                  <span className="transition-transform duration-300 text-xs" style={{
                    transform: activeMenu === menu.label ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>
                    ▼
                  </span>
                </Link>

                {/* 不可见桥接区：覆盖按钮与下拉菜单之间的 8px 间隙，防止 onMouseLeave 误触发 */}
                {activeMenu === menu.label && (
                  <div
                    className="absolute top-full left-0 w-full h-2"
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* 下拉子菜单 - 用 padding-top 占位形成"桥接区"，避免按钮与菜单间的间隙触发 onMouseLeave */}
                {activeMenu === menu.label && (
                  <div
                    className="absolute top-full left-0 pt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-4 z-50"
                    style={{
                      animation: 'fadeInDown 0.2s ease-out',
                      minWidth: '280px',
                    }}
                    onMouseEnter={() => handleMenuEnter(menu.label)}
                    onMouseLeave={handleMenuLeave}
                  >
                    {menu.items.map((category) =>
                      'subItems' in category && Array.isArray((category as { subItems?: unknown[] }).subItems) ? (
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
                          {((category as { subItems: { href: string; label: string; icon?: string }[] }).subItems).map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              prefetch={true}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 transition-all duration-200 mx-2 rounded-lg"
                              style={{
                                fontFamily: "'Ma Shan Zheng', cursive, serif",
                                letterSpacing: '1px',
                              }}
                              onClick={() => {
                                handleMenuLeave();
                                closeMobileMenu();
                              }}
                            >
                              <span className="text-lg">{item.icon}</span>
                              <span>{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <Link
                          key={(category as { href: string }).href}
                          href={(category as { href: string }).href}
                          prefetch={true}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 transition-all duration-200 mx-2 rounded-lg"
                          style={{
                            fontFamily: "'Ma Shan Zheng', cursive, serif",
                            letterSpacing: '1px',
                          }}
                          onClick={() => {
                            handleMenuLeave();
                            closeMobileMenu();
                          }}
                        >
                          <span className="text-lg">{(category as { icon?: string }).icon}</span>
                          <span>{category.label}</span>
                        </Link>
                      )
                    )}
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

          {/* 移动端菜单按钮 */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
          >
            <svg className="w-6 h-6 text-[#2c2c2c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* 移动端菜单 */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 animate-slideDown">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {menuItems.map((menu) => (
                <div key={menu.label} className="border-b border-gray-100 last:border-b-0">
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
                    style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                  >
                    <span className="text-[#2c2c2c]">{menu.label}</span>
                    <span className={`transition-transform duration-300 ${activeMenu === menu.label ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  
                  {/* 移动端子菜单 */}
                  {activeMenu === menu.label && (
                    <div className="bg-gray-50 px-2 py-2 animate-fadeIn">
                      {menu.items.map((category) =>
                        'subItems' in category && Array.isArray((category as { subItems?: unknown[] }).subItems) ? (
                          <div key={category.label}>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                              {category.label}
                            </div>
                            {((category as { subItems: { href: string; label: string; icon?: string }[] }).subItems).map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                prefetch={true}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors block w-full"
                                onClick={closeMobileMenu}
                              >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <Link
                            key={(category as { href: string }).href}
                            href={(category as { href: string }).href}
                            prefetch={true}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors block w-full"
                            onClick={closeMobileMenu}
                          >
                            <span className="text-lg">{(category as { icon?: string }).icon}</span>
                            <span>{category.label}</span>
                          </Link>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* 移动端用户状态 */}
              <div className="p-4 border-t border-gray-100">
                <UserStatus />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 动画样式 */}
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
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </nav>
  );
}
