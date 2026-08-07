'use client';

import { useState, useEffect, useRef } from 'react';
import { useAIChat } from '@/hooks/useAIChat';

/**
 * AI 禅师 · 灵境（沉浸式禅意工作坊）—— 客户端交互组件
 * 由 ZenPageShell 通过 next/dynamic 异步加载，ssr:false。
 */

const ZEN_CAPSULES = [
  { emoji: '🔹', label: '什么是开悟？', query: '什么是开悟？请禅师开示。' },
  { emoji: '🔹', label: '我最近压力很大', query: '我最近压力很大，心里很乱，请禅师开示。' },
  { emoji: '🔹', label: '讲一个禅宗公案', query: '请讲一个禅宗公案。' },
];

export default function ZenClient() {
  const { messages, sendMessage, isLoading, freeTurns } = useAIChat({ type: 'ai-zen-master' });
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [hasAskedOnce, setHasAskedOnce] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [capsulesFading, setCapsulesFading] = useState(false);
  const chatTopRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (inputValue) {
      setCapsulesFading(true);
      setHasAskedOnce(true);
    }
  }, [inputValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = inputValue.trim();
    if (v && !isLoading) {
      sendMessage(v);
      setInputValue('');
      setHasAskedOnce(true);
      setCapsulesFading(true);
    }
  };

  const handleCapsule = (q: string) => {
    if (isLoading) return;
    sendMessage(q);
    setCapsulesFading(true);
    setHasAskedOnce(true);
    setTimeout(() => {
      chatTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (messages.length > 0 && capsulesFading) {
      const t = setTimeout(() => setHasAskedOnce(true), 700);
      return () => clearTimeout(t);
    }
  }, [messages.length, capsulesFading]);

  const placeholder = isFocused
    ? '请讲...'
    : isHovering
    ? '按下回车键，开启对话'
    : '🌿 此刻，你的心念是什么？';

  const remaining = freeTurns?.remaining ?? 0;
  const used = freeTurns?.used ?? 0;
  const isExhausted = freeTurns?.mounted && remaining <= 0 && !freeTurns?.isExempt;
  const showSoftPrompt = mounted && !freeTurns?.isExempt && used >= 4;

  return (
    <>
      {/* 背景：渐变光晕 + 星云粒子 + 流动墨线 */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ background: 'rgba(180, 130, 70, 0.10)', animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-1/3 right-1/3 w-[28rem] h-[28rem] rounded-full blur-3xl animate-pulse"
          style={{ background: 'rgba(90, 75, 60, 0.20)', animationDuration: '12s', animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse"
          style={{ background: 'rgba(120, 90, 50, 0.06)', animationDuration: '10s', animationDelay: '4s' }}
        />
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.18 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="ink">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.5   0 0 0 0 0.4   0 0 0 0 0.3   0 0 0 0.15 0"
              />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#ink)" />
        </svg>
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-px bg-gradient-to-b from-transparent via-white/8 to-transparent"
              style={{
                left: `${10 + i * 12}%`,
                height: '100%',
                animation: `flow ${10 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 主内容 */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 p-8 text-center">
        <div className="min-h-[35vh] flex flex-col items-center justify-start space-y-10 mb-8 pt-4">
          {messages.length === 0 ? (
            <div className="text-center mt-4">
              <div className="text-5xl mb-6 opacity-50 buddha-breath">🧘</div>
              <p
                className="text-xl text-white/60 leading-relaxed"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '0.1em' }}
              >
                风过竹林，水流花开。
              </p>
              <p
                className="text-sm text-white/30 mt-3"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '0.1em' }}
              >
                灵境在此，等你一问。
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isAssistant = msg.role === 'assistant';
              const isLast = idx === messages.length - 1;
              const showSoftSuffix = isAssistant && isLast && showSoftPrompt && !isLoading;
              return (
                <div key={idx} className="max-w-2xl w-full">
                  <div
                    className={`transition-all duration-700 ${
                      isAssistant ? 'text-white/90 text-xl md:text-2xl' : 'text-white/55 text-lg'
                    }`}
                    style={{
                      fontFamily: "'Ma Shan Zheng', cursive, serif",
                      letterSpacing: '0.05em',
                    }}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                      {isAssistant && isLast && isLoading && (
                        <span className="inline-block w-1.5 h-5 ml-1 align-middle bg-amber-200/70 animate-pulse" />
                      )}
                    </p>
                    {showSoftSuffix && (
                      <p
                        className="mt-6 text-sm text-amber-200/55 italic"
                        style={{ letterSpacing: '0.1em' }}
                      >
                        —— 你今天的机锋问答颇有见地。若能开启会员，或可于静室中与我细论更深层奥义。
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div className="flex flex-col items-center mt-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-2 border-white/15 rounded-full animate-spin" style={{ animationDuration: '4s' }} />
                <div className="absolute inset-2 border border-white/25 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                <div className="absolute inset-4 border border-white/35 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
              </div>
              <p
                className="mt-4 text-white/35 text-sm"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '0.1em' }}
              >
                禅思中...
              </p>
            </div>
          )}
        </div>

        <div ref={chatTopRef} />

        <form onSubmit={handleSubmit} className="mt-12 pb-20">
          {mounted && !freeTurns?.isExempt && freeTurns?.remaining !== undefined && freeTurns.remaining <= 2 && freeTurns.remaining >= 0 && (
            <div
              className={`mb-6 text-[11px] tracking-[0.2em] ${
                freeTurns.remaining === 0 ? 'text-amber-200/55' : 'text-white/30'
              }`}
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            >
              今日机锋 {freeTurns.used} / {freeTurns.limit}
            </div>
          )}

          <div
            className={`relative max-w-xl mx-auto cursor-pointer transition-transform duration-500 ${
              isFocused ? 'zen-input-focused' : isHovering ? 'zen-input-hover' : 'zen-input-breathing'
            }`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={focusInput}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={isLoading}
              placeholder={placeholder}
              maxLength={200}
              className="w-full px-8 py-5 bg-transparent border-b-2 border-white/15 text-white text-center text-xl outline-none transition-all duration-500 cursor-text placeholder:text-white/35 focus:border-amber-200/50 focus:placeholder:text-amber-200/40 disabled:opacity-50 focus:caret-amber-200"
              style={{
                fontFamily: "'Ma Shan Zheng', cursive, serif",
                letterSpacing: '0.1em',
              }}
            />
          </div>

          {!inputValue && (
            <div
              className={`mt-8 flex flex-wrap justify-center gap-3 transition-all duration-700 ${
                capsulesFading ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100'
              }`}
            >
              {ZEN_CAPSULES.map((c, i) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => handleCapsule(c.query)}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/15 text-white/60 text-sm hover:bg-white/10 hover:text-white/90 hover:border-white/30 transition-all duration-500 disabled:opacity-30"
                  style={{
                    fontFamily: "'Ma Shan Zheng', cursive, serif",
                    letterSpacing: '0.1em',
                    animation: `floatCapsule ${6 + i * 1.2}s ease-in-out infinite`,
                    animationDelay: `${i * 0.4}s`,
                  }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {!paywallOpen && (
        <button
          onClick={() => setPaywallOpen(true)}
          className="fixed bottom-5 right-5 z-30 text-white/20 hover:text-white/45 transition-colors text-[10px] tracking-[0.3em]"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          title="静室之门"
        >
          . 问
        </button>
      )}

      {paywallOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPaywallOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-gradient-to-b from-stone-900 to-black border border-amber-200/20 rounded-2xl p-7 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-3 opacity-70">🪷</div>
            <h3
              className="text-lg text-amber-100/90"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '0.1em' }}
            >
              静室之门
            </h3>
            <p
              className="text-sm text-white/55 mt-3 leading-relaxed"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '0.05em' }}
            >
              若有机缘深入，<br />可于静室中与灵境细论更深的奥义。
            </p>
            <div className="mt-6 space-y-2.5">
              <button
                className="w-full py-2.5 rounded-full bg-amber-200/15 hover:bg-amber-200/25 border border-amber-200/30 text-amber-100/90 text-sm transition-all"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '0.1em' }}
                onClick={() => alert('单次解锁 ¥9.9（接入支付）')}
              >
                今日单次解锁 · ¥9.9
              </button>
              <button
                className="w-full py-2.5 rounded-full bg-amber-200/85 hover:bg-amber-200 text-stone-900 text-sm font-medium transition-all"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '0.1em' }}
                onClick={() => alert('静室会员 · ¥29.9/月（接入支付）')}
              >
                静室会员 · ¥29.9/月
              </button>
              <button
                onClick={() => setPaywallOpen(false)}
                className="w-full py-1.5 text-white/35 text-xs hover:text-white/55"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '0.1em' }}
              >
                改日再访
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes flow {
          0%, 100% { opacity: 0; transform: translateY(-100%); }
          50% { opacity: 1; transform: translateY(100%); }
        }
        @keyframes floatCapsule {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes zenBreath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.025); }
        }
        @keyframes zenGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 130, 0); }
          50% { box-shadow: 0 0 24px 4px rgba(255, 215, 130, 0.22), 0 0 60px 8px rgba(255, 215, 130, 0.08); }
        }
        @keyframes buddhaBreath {
          0%, 100% { transform: translateY(0); filter: drop-shadow(0 0 6px rgba(255, 215, 130, 0.18)); }
          50% { transform: translateY(-4px); filter: drop-shadow(0 0 18px rgba(255, 215, 130, 0.45)); }
        }
        .buddha-breath { animation: buddhaBreath 4s ease-in-out infinite; display: inline-block; }
        .zen-input-breathing { animation: zenBreath 4s ease-in-out infinite; }
        .zen-input-hover { animation: zenBreath 2.5s ease-in-out infinite; filter: brightness(1.18); }
        .zen-input-hover input { border-bottom-color: rgba(255, 255, 255, 0.32); }
        .zen-input-focused { transform: scale(1.04); animation: zenGlow 2.4s ease-in-out infinite; }
      `}</style>
    </>
  );
}
