'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import ChatUI from '@/components/ChatUI';
import Link from 'next/link';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';

export function AcharyaFloatingButton() {
  const [showChat, setShowChat] = useState(false);
  const [showBottomChat, setShowBottomChat] = useState(false);
  const isAuthenticated = useIsAuthenticated();

  const handleClick = () => {
    if (isAuthenticated) {
      setShowBottomChat(true);
    } else {
      setShowChat(true);
    }
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
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121212] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden border border-[#333333]"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#333333]">
                <h3
                  className="text-lg font-semibold"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
                >
                  阿阇梨咨询
                </h3>
                <button onClick={() => setShowChat(false)} className="text-[#808080] hover:text-white">
                  ✕
                </button>
              </div>
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#8B4513] to-[#D4AF37] flex items-center justify-center">
                  <span className="text-2xl">🧘</span>
                </div>
                <h4 className="text-white text-lg font-semibold mb-2">请先登录</h4>
                <p className="text-[#808080] text-sm mb-6">登录后即可与阿阇梨进行专属对话</p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href="/muxintang/login"
                    className="px-6 py-2 bg-[#D4AF37] text-black font-semibold rounded-xl hover:opacity-90 transition-all"
                  >
                    立即登录
                  </Link>
                  <Link
                    href="/muxintang/register"
                    className="px-6 py-2 border border-[#D4AF37]/50 text-[#D4AF37] font-semibold rounded-xl hover:bg-[#D4AF37]/10 transition-all"
                  >
                    注册账号
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="p-4">
                <ChatUI
                  config={{
                    title: '阿阇梨',
                    subtitle: '牧心堂阿阇梨',
                    icon: '🧭',
                    theme: 'muxintang',
                    welcomeMessage: '同修，今日有何困惑？愿为您开示。',
                    difyType: 'muxintang',
                    requireConsent: true,
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