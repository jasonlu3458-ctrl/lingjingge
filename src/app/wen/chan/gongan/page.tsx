'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import Disclaimer from '@/components/Disclaimer';

const gongans = [
  '如何是祖师西来意？',
  '什么是佛？',
  '什么是禅？',
  '道在何处？',
  '如何是本来面目？',
  '万法归一，一归何处？',
  '狗子还有佛性也无？',
  '竹影扫阶尘不动，月穿潭底水无痕。如何会？'
];

export default function GonganPage() {
  const { messages, sendMessage, isLoading, freeTurns } = useAIChat({ type: 'gongan' });
  const [input, setInput] = useState('');
  const [currentGongan, setCurrentGongan] = useState('');
  const [count, setCount] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const initialized = useRef(false);

  const loadNewGongan = useCallback(() => {
    let random = gongans[Math.floor(Math.random() * gongans.length)];
    // 确保不重复
    while (random === currentGongan && gongans.length > 1) {
      random = gongans[Math.floor(Math.random() * gongans.length)];
    }
    setCurrentGongan(random);
    setShowAnswer(false);
    setInput('');
  }, [currentGongan]);

  useEffect(() => {
    // 使用 ref 确保只在组件挂载时初始化一次，避免依赖变化导致的无限循环
    if (!initialized.current) {
      initialized.current = true;
      loadNewGongan();
      // 从 localStorage 读取参悟次数
      const savedCount = localStorage.getItem('gongan_count');
      if (savedCount) {
        setCount(parseInt(savedCount, 10));
      }
    }
  }, [loadNewGongan]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
      const newCount = count + 1;
      setCount(newCount);
      localStorage.setItem('gongan_count', newCount.toString());
      setInput('');
      setShowAnswer(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 to-stone-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* 顶部标题 */}
        <div className="text-center mb-8">
          <div className="text-4xl font-serif text-amber-100 mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '0.1em' }}>
            公案参究
          </div>
          <div className="text-sm text-amber-200/70" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            以疑为门，以悟为归
          </div>
        </div>

        {/* 主卡片 */}
        <div className="bg-gradient-to-br from-amber-900/80 to-stone-800/60 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-amber-700/30">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🪷</div>
            <div className="text-xl font-serif text-amber-100 mb-1" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}>
              公案参悟
            </div>
            <div className="text-sm text-amber-200/70">已参悟 {count} 次</div>
          </div>

          {/* 公案展示 */}
          <div className="bg-amber-950/60 rounded-xl p-8 mb-6 text-center border border-amber-600/20">
            <div className="text-xl md:text-2xl font-serif text-amber-100 tracking-wider italic" 
                 style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              「{currentGongan}」
            </div>
          </div>

          {/* 免费轮次提示 */}
          {freeTurns?.mounted && !freeTurns.isExempt && freeTurns.remaining <= 2 && freeTurns.remaining >= 0 && (
            <div
              className={`mb-4 text-sm text-center ${
                freeTurns.remaining === 0 ? 'text-red-300' : 'text-amber-200/80'
              }`}
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            >
              {freeTurns.remaining === 0
                ? `本工具免费体验已用完（${freeTurns.used}/${freeTurns.limit}）· 注册后可继续参悟`
                : `免费体验还剩 ${freeTurns.remaining} 次（${freeTurns.used}/${freeTurns.limit}）`}
              {freeTurns.remaining === 0 && (
                <a
                  href={`/tong/signup?redirect=${encodeURIComponent('/wen/chan/gongan')}`}
                  className="ml-2 underline font-medium text-amber-100 hover:text-white"
                >
                  立即注册
                </a>
              )}
            </div>
          )}

          {/* 参悟输入区 */}
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 p-4 bg-amber-950/50 border border-amber-600/30 rounded-lg text-amber-100 placeholder-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              placeholder="请说出你的见解..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSubmit();
                }
              }}
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="px-8 py-4 bg-amber-700 text-amber-50 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            >
              {isLoading ? '思忖中...' : '参悟'}
            </button>
          </div>

          {/* AI 回应 */}
          {showAnswer && messages.length > 0 && (
            <div className="mt-6 p-6 bg-amber-950/40 rounded-xl border border-amber-600/20">
              {messages[messages.length - 1].role === 'assistant' && (
                <div className="text-center">
                  <div className="text-amber-400 text-sm mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                    师曰
                  </div>
                  <div className="text-amber-100 text-2xl font-bold" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                    {messages[messages.length - 1].content}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 加载状态 */}
          {isLoading && (
            <div className="mt-6 flex justify-center">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-2 border-amber-400/30 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border border-amber-400/50 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
                <div className="absolute inset-4 border border-amber-400/70 rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
              </div>
            </div>
          )}

          {/* 换一则公案 */}
          <div className="mt-6 text-center">
            <button
              onClick={loadNewGongan}
              className="px-6 py-2 text-amber-200/60 hover:text-amber-100 transition-colors"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            >
              换一则公案 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
