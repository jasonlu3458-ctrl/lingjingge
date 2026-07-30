'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import ChatUI from '@/components/ChatUI';
import { useUserRole } from '@/hooks/useUserRole';

export function AcharyaFloatingButton() {
  // 未登录用户也能直接开 ChatUI 吃 5 次免费；
  // 会员/管理员走 useUserRole 自动免限；useFreeTurns 在 ChatUI 内部用 trySend 守门
  const [showBottomChat, setShowBottomChat] = useState(false);
  const [pageContext, setPageContext] = useState<{ path: string; title: string }>({ path: '', title: '' });
  const [pendingMessage, setPendingMessage] = useState<string | undefined>(undefined);
  const userRole = useUserRole();
  const pathname = usePathname();

  // 浮层打开时刷新一次页面上下文（保证 title 拿到的是当前页最新值）
  useEffect(() => {
    if (showBottomChat && typeof window !== 'undefined') {
      setPageContext({
        path: pathname || window.location.pathname,
        title: document.title || '',
      });
    }
  }, [showBottomChat, pathname]);

  // 三个快捷胶囊：根据当前页面拼装 prefill 文案
  const quickPills = useMemo(() => {
    const safeTitle = pageContext.title || '当前页面';
    const safePath = pageContext.path || '当前页面';
    return [
      {
        icon: '🔍',
        label: '这页讲什么？',
        prompt: `同修，我正在浏览【${safeTitle}】（路径：${safePath}）。请用一句话介绍这页的功能与适用场景。`,
      },
      {
        icon: '🛠',
        label: '怎么用？',
        prompt: `同修，我在【${safePath}】页面。请告诉我这个工具/页面的使用步骤，越具体越好。`,
      },
      {
        icon: '💰',
        label: '怎么收费？',
        prompt: '同修，灵境阁的付费、订阅、同修币规则是怎样的？哪些是免费体验，哪些需要付费？',
      },
    ];
  }, [pageContext]);

  const handleClick = () => {
    // 直接开浮层，让 ChatUI 内部的 useFreeTurns 决定 5 轮免费 / 会员免限 / 超限跳注册
    setShowBottomChat(true);
  };

  const handleQuickAsk = (prompt: string) => {
    setPendingMessage(prompt);
  };

  const handlePendingConsumed = () => {
    setPendingMessage(undefined);
  };

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center justify-center">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-[#D4AF37]/20"
            style={{ width: '60px', height: '60px' }}
            animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: i * 1.8,
              ease: 'easeInOut',
            }}
          />
        ))}

        <motion.button
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0a0a0a] border border-[#D4AF37]/50 flex items-center justify-center shadow-lg hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-shadow"
          animate={{
            boxShadow: [
              '0 0 0px rgba(212,175,55,0)',
              '0 0 20px rgba(212,175,55,0.4)',
              '0 0 0px rgba(212,175,55,0)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          onClick={handleClick}
          aria-label="咨询阿阇梨"
        >
          <svg viewBox="0 0 40 40" className="w-8 h-8">
            <defs>
              <radialGradient id="seedGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#8B4513" />
              </radialGradient>
            </defs>
            <circle cx="20" cy="20" r="18" fill="none" stroke="url(#seedGradient)" strokeWidth="1" opacity="0.6" />
            <path d="M20 8 L20 32 M8 20 L32 20" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="20" cy="20" r="4" fill="#D4AF37" />
          </svg>
        </motion.button>
      </div>

      <AnimatePresence>
        {showBottomChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#121212] rounded-t-3xl w-full max-w-lg max-h-[70vh] overflow-hidden border-t border-x border-[#333333]"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#333333]">
                <h3
                  className="text-lg font-semibold"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
                >
                  💬 阿阇梨快问快答
                </h3>
                <button onClick={() => setShowBottomChat(false)} className="text-[#808080] hover:text-white">
                  ✕
                </button>
              </div>
              {/* 系统管家 · 3 个快捷咨询胶囊（基于当前 pageContext 预填） */}
              <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto border-b border-[#333333]/40">
                {quickPills.map((pill) => (
                  <button
                    key={pill.label}
                    type="button"
                    onClick={() => handleQuickAsk(pill.prompt)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[#1A1A1A] border border-[#D4AF37]/30 text-[#D4AF37] text-xs whitespace-nowrap hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/60 transition-colors"
                    style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                  >
                    <span className="mr-1">{pill.icon}</span>
                    {pill.label}
                  </button>
                ))}
              </div>
              <div className="p-4">
                <ChatUI
                  userRole={userRole}
                  config={{
                    title: '阿阇梨',
                    subtitle: '牧心堂阿阇梨',
                    icon: '🧭',
                    theme: 'muxintang',
                    welcomeMessage: '同修，今日有何困惑？愿为您开示。',
                    difyType: 'muxintang',
                    requireConsent: true,
                    pageContext,
                    pendingMessage,
                    onMessageSent: handlePendingConsumed,
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}