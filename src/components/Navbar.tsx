'use client';

import Link from 'next/link';
import UserStatus from './UserStatus';

export default function Navbar() {
  return (
    <nav className="bg-zen-beige border-b border-zen-gray sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/home" className="text-2xl font-bold text-zen-ink">
              灵境阁
            </Link>
          </div>
          
          {/* 导航菜单 - 桌面端 */}
          <div className="hidden lg:flex gap-6 items-center">
            <Link 
              href="/home" 
              className="text-zen-ink hover:text-gray-600 transition-colors text-sm font-medium"
              title="仙山入口"
            >
              首页
            </Link>

            {/* 修仙道 */}
            <div className="relative group">
              <span className="text-zen-ink hover:text-gray-600 transition-colors text-sm font-medium cursor-pointer flex items-center gap-1">
                修仙道
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div className="absolute top-full left-0 mt-1 bg-white border border-zen-gray rounded-lg shadow-lg py-2 min-w-[140px] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link 
                  href="/health" 
                  className="block px-4 py-2 text-zen-ink hover:bg-gray-50 transition-colors text-sm"
                >
                  AI体质观察
                </Link>
                <Link 
                  href="/name" 
                  className="block px-4 py-2 text-zen-ink hover:bg-gray-50 transition-colors text-sm"
                >
                  AI取名轩
                </Link>
                <Link 
                  href="/tili" 
                  className="block px-4 py-2 text-zen-ink hover:bg-gray-50 transition-colors text-sm"
                >
                  AI炼体师
                </Link>
              </div>
            </div>

            {/* 开悟门 */}
            <div className="relative group">
              <span className="text-zen-ink hover:text-gray-600 transition-colors text-sm font-medium cursor-pointer flex items-center gap-1">
                开悟门
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div className="absolute top-full left-0 mt-1 bg-white border border-zen-gray rounded-lg shadow-lg py-2 min-w-[140px] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link 
                  href="/ai-zen-master" 
                  className="block px-4 py-2 text-zen-ink hover:bg-gray-50 transition-colors text-sm"
                >
                  AI禅师
                </Link>
              </div>
            </div>

            {/* 明心灯 */}
            <div className="relative group">
              <span className="text-zen-ink hover:text-gray-600 transition-colors text-sm font-medium cursor-pointer flex items-center gap-1">
                明心灯
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div className="absolute top-full left-0 mt-1 bg-white border border-zen-gray rounded-lg shadow-lg py-2 min-w-[140px] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link 
                  href="/mind" 
                  className="block px-4 py-2 text-zen-ink hover:bg-gray-50 transition-colors text-sm"
                >
                  AI疗愈师
                </Link>
              </div>
            </div>

            <Link 
              href="/library" 
              className="text-zen-ink hover:text-gray-600 transition-colors text-sm font-medium"
              title="智慧传承"
            >
              藏经阁
            </Link>

            {/* 同修会 */}
            <div className="relative group">
              <span className="text-zen-ink hover:text-gray-600 transition-colors text-sm font-medium cursor-pointer flex items-center gap-1">
                同修会
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div className="absolute top-full left-0 mt-1 bg-white border border-zen-gray rounded-lg shadow-lg py-2 min-w-[140px] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <span className="block px-4 py-2 text-gray-400 text-sm">即将开放...</span>
              </div>
            </div>

            {/* 我的洞府 */}
            <div className="relative group">
              <span className="text-zen-ink hover:text-gray-600 transition-colors text-sm font-medium cursor-pointer flex items-center gap-1">
                我的洞府
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div className="absolute top-full left-0 mt-1 bg-white border border-zen-gray rounded-lg shadow-lg py-2 min-w-[140px] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link 
                  href="/profile" 
                  className="block px-4 py-2 text-zen-ink hover:bg-gray-50 transition-colors text-sm"
                >
                  个人中心
                </Link>
                <Link 
                  href="/pricing" 
                  className="block px-4 py-2 text-zen-ink hover:bg-gray-50 transition-colors text-sm"
                >
                  会员订阅
                </Link>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center">
            <UserStatus />
          </div>
        </div>
      </div>
    </nav>
  );
}
