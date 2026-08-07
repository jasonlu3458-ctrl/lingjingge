'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';

const ChatUI = dynamic(() => import('@/components/ChatUI'), { ssr: false });

export type UniversalAIHelperRole = 'muxintang' | 'lingjingge';

export interface UniversalAIHelperProps {
  role: UniversalAIHelperRole;
}

/**
 * 全站统一 AI 助手浮窗。
 * - role='muxintang'  → 金色（牧心堂 · 阿阇梨）
 * - role='lingjingge' → 米白 / 青蓝色（灵境阁 · 灵境尊者）
 */
export function UniversalAIHelper({ role }: UniversalAIHelperProps) {
  const [showBottomChat, setShowBottomChat] = useState(false);
  const [pageContext, setPageContext] = useState<{ path: string; title: string }>({ path: '', title: '' });
  const [pendingMessage, setPendingMessage] = useState<string | undefined>(undefined);
  const userRole = useUserRole();
  const pathname = usePathname();

  useEffect(() => {
    if (showBottomChat && typeof window !== 'undefined') {
      setPageContext({
        path: pathname || window.location.pathname,
        title: document.title || '',
      });
    }
  }, [showBottomChat, pathname]);

  const isMuxintang = role === 'muxintang';

  // 主题色：根据 role 切换
  const theme = useMemo(() => {
    if (isMuxintang) {
      return {
        ringColor: '#D4AF37',
        ringColorSoft: 'rgba(212,175,55,0.4)',
        btnFrom: '#1A1A1A',
        btnTo: '#0a0a0a',
        btnBorder: 'rgba(212,175,55,0.5)',
        btnHover: 'rgba(212,175,55,0.4)',
        iconStroke: '#D4AF37',
        title: '💬 阿阇梨快问快答',
        character: '阿阇梨',
        subtitle: '牧心堂阿阇梨',
        difyType: 'muxintang',
      };
    }
    // 灵境阁主站：米白/青蓝色
    return {
      ringColor: '#3b6e8f',
      ringColorSoft: 'rgba(59,110,143,0.35)',
      btnFrom: '#f7f3ec',
      btnTo: '#e8e2d4',
      btnBorder: 'rgba(59,110,143,0.4)',
      btnHover: 'rgba(59,110,143,0.3)',
      iconStroke: '#3b6e8f',
      title: '💬 灵境尊者 · 答疑',
      character: '灵境尊者',
      subtitle: '灵境阁主站',
      difyType: 'lingjingge-helper',
    };
  }, [isMuxintang]);

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
            className="absolute rounded-full border"
            style={{
              width: '60px',
              height: '60px',
              borderColor: `${theme.ringColor}33`,
            }}
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
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-shadow"
          style={{
            background: `linear-gradient(135deg, ${theme.btnFrom}, ${theme.btnTo})`,
            border: `1px solid ${theme.btnBorder}`,
          }}
          animate={{
            boxShadow: [
              `0 0 0px ${theme.ringColorSoft.replace('0.4', '0')}`,
              `0 0 20px ${theme.ringColorSoft}`,
              `0 0 0px ${theme.ringColorSoft.replace('0.4', '0')}`,
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          onClick={() => setShowBottomChat(true)}
          aria-label={isMuxintang ? '咨询阿阇梨' : '咨询灵境尊者'}
        >
          <svg viewBox="0 0 40 40" className="w-8 h-8">
            <defs>
              <radialGradient id={`seedGradient-${role}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={theme.iconStroke} />
                <stop offset="100%" stopColor={isMuxintang ? '#8B4513' : '#1f4a66'} />
              </radialGradient>
            </defs>
            <circle cx="20" cy="20" r="18" fill="none" stroke={`url(#seedGradient-${role})`} strokeWidth="1" opacity="0.6" />
            <path
              d="M20 8 L20 32 M8 20 L32 20"
              stroke={theme.iconStroke}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="20" cy="20" r="4" fill={theme.iconStroke} />
          </svg>
        </motion.button>
      </div>

      <AnimatePresence>
        {showBottomChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: isMuxintang ? 'rgba(0,0,0,0.6)' : 'rgba(20,20,20,0.45)' }}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={
                isMuxintang
                  ? 'bg-[#121212] rounded-t-3xl w-full max-w-lg max-h-[70vh] overflow-hidden border-t border-x border-[#333333]'
                  : 'bg-white rounded-t-3xl w-full max-w-lg max-h-[70vh] overflow-hidden border-t border-x border-stone-200 shadow-2xl'
              }
            >
              <div
                className={
                  isMuxintang
                    ? 'flex items-center justify-between p-4 border-b border-[#333333]'
                    : 'flex items-center justify-between p-4 border-b border-stone-200'
                }
              >
                <h3
                  className="text-lg font-semibold"
                  style={{
                    fontFamily: "'Ma Shan Zheng', cursive, serif",
                    color: isMuxintang ? '#D4AF37' : '#3b6e8f',
                  }}
                >
                  {theme.title}
                </h3>
                <button
                  onClick={() => setShowBottomChat(false)}
                  className={isMuxintang ? 'text-[#808080] hover:text-white' : 'text-stone-500 hover:text-stone-900'}
                >
                  ✕
                </button>
              </div>
              <div
                className={
                  isMuxintang
                    ? 'px-4 pt-3 pb-1 flex gap-2 overflow-x-auto border-b border-[#333333]/40'
                    : 'px-4 pt-3 pb-1 flex gap-2 overflow-x-auto border-b border-stone-100'
                }
              >
                {quickPills.map((pill) => (
                  <button
                    key={pill.label}
                    type="button"
                    onClick={() => handleQuickAsk(pill.prompt)}
                    className={
                      isMuxintang
                        ? 'flex-shrink-0 px-3 py-1.5 rounded-full bg-[#1A1A1A] border text-xs whitespace-nowrap transition-colors'
                        : 'flex-shrink-0 px-3 py-1.5 rounded-full bg-stone-50 border text-xs whitespace-nowrap transition-colors'
                    }
                    style={{
                      borderColor: `${theme.ringColor}55`,
                      color: theme.ringColor,
                      fontFamily: "'Ma Shan Zheng', cursive, serif",
                    }}
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
                    title: theme.character,
                    subtitle: theme.subtitle,
                    icon: '🧭',
                    theme: isMuxintang ? 'muxintang' : 'lingjingge',
                    welcomeMessage: isMuxintang
                      ? '同修，今日有何困惑？愿为您开示。'
                      : '同修，灵境尊者在此。若有修行、生活、命理之惑，但问无妨。',
                    difyType: theme.difyType,
                    requireConsent: true,
                    pageContext,
                    pendingMessage,
                    onMessageSent: handlePendingConsumed,
                    initialSuggestions: isMuxintang
                      ? ['我想了解我的八字', '今天运势如何', '生命密码怎么看']
                      : ['我想了解我的命理', '今日修行指引', '解惑与自我觉察'],
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

export default UniversalAIHelper;
