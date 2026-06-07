'use client';

import { useState, useEffect } from 'react';
import { useAIChat } from '@/hooks/useAIChat';

export default function AISeekerPage() {
  const { messages, sendMessage, isLoading } = useAIChat({ type: 'ai-zen-master' });
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // 页面加载淡入效果
    setFadeIn(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative overflow-hidden">
      {/* 水墨背景动画 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 墨点扩散效果 */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-black/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gray-800/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-gray-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* 水墨纹理 */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#noise)"/>
        </svg>

        {/* 动态水墨线条 */}
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"
              style={{
                left: `${15 + i * 17}%`,
                height: '100%',
                animation: `flow ${8 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 中央对话区 */}
      <div 
        className={`relative z-10 max-w-3xl mx-auto p-8 text-center transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* 标题 */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-white/90 mb-4" 
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '0.1em' }}>
            AI禅师
          </h1>
          <p className="text-white/50 text-lg" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            机锋对答，参悟禅心
          </p>
        </div>

        {/* 对话消息区 */}
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-8 mb-8">
          {messages.length === 0 ? (
            // 初始欢迎状态
            <div className="text-center">
              <div className="text-6xl mb-6 opacity-60">🧘</div>
              <p className="text-xl text-white/70 max-w-xl mx-auto leading-relaxed" 
                 style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                闲坐茶亭，与君共话禅机。
              </p>
              <p className="text-sm text-white/40 mt-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                按下回车键，开启对话
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-2xl transition-all duration-500 ${
                  msg.role === 'assistant' 
                    ? 'text-white/90 text-xl md:text-2xl' 
                    : 'text-white/50 text-lg'
                }`}
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}

          {/* 加载状态 */}
          {isLoading && (
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                <div className="absolute inset-2 border border-white/30 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                <div className="absolute inset-4 border border-white/40 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
              </div>
              <p className="mt-4 text-white/40 text-sm" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                禅思中...
              </p>
            </div>
          )}
        </div>

        {/* 输入区 */}
        <form onSubmit={handleSubmit} className="mt-8">
          <div className="relative max-w-lg mx-auto">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="参..."
              className="w-full p-4 bg-transparent border-b-2 border-white/20 text-white text-center text-xl focus:outline-none focus:border-white/50 transition-colors disabled:opacity-50"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            />
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-white/50 transition-all duration-300" 
                 style={{ width: inputValue ? '100%' : '0%' }}></div>
          </div>
          <p className="text-xs text-white/30 mt-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            按 Enter 发送 · 单次问答 · 深度内容需会员
          </p>
        </form>

        {/* 展开按钮 */}
        {messages.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-8 text-white/40 hover:text-white/60 transition-colors text-sm"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            {isExpanded ? '收起' : '展开对话'}
          </button>
        )}
      </div>

      {/* 自定义 CSS 动画 */}
      <style>{`
        @keyframes flow {
          0%, 100% {
            opacity: 0;
            transform: translateY(-100%);
          }
          50% {
            opacity: 1;
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  );
}
