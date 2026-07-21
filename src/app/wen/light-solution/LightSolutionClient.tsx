'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import InkSpreadAnimation from '@/components/InkSpreadAnimation';
import ConsentModal from '@/components/ConsentModal';
import ReportPaywall from '@/components/ReportPaywall';
import { useFreeTurns } from '@/hooks/useFreeTurns';
import { useConsent } from '@/hooks/useConsent';
import type { UserRole } from '@/lib/auth';

interface LightSolutionClientProps {
  userRole?: UserRole;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

// AI 欢迎气泡（初始化时硬编码 1 条）
const INITIAL_AI_BUBBLE =
  '你好，我是灵境阁的解忧师。今天有什么烦心事，可以和我说说吗？';

// 快捷倾诉按钮文案（点击后填入输入框）
const QUICK_PROMPTS = [
  '我最近感觉压力很大',
  '和伴侣经常吵架',
  '工作总是很迷茫',
];

// 4 次后 AI 引导话术（第 4 次用户消息后，AI 回复末尾追加）
const RETENTION_NUDGE =
  '\n\n—— 我看你很需要深度梳理，如果想继续聊下去，可以试试开通会员，获得无限制陪伴和专属解忧报告。';

// 禅意格言（顶部/角落轮播）
const ZEN_QUOTES = [
  '心若沉静，烦恼自清；找到本心，即是解答。',
  '一花一世界，一叶一菩提。',
  '心安即是归处。',
  '此刻即岸。',
];

// 报告分段（3 轮后展示）—— 与 pageConfigs 中 light-solution 的结构保持一致
const REPORT_STRUCTURE = {
  free: ['情绪标签', '困扰简析', '可尝试的一步'],
  premium: ['深层模式识别', '专属建议清单', '7 天自我照护计划'],
};

const TOTAL_ROUNDS = 3;

export default function LightSolutionClient({ userRole = 'free' }: LightSolutionClientProps) {
  const { used, limit, remaining, isExempt, canSend, trySend, mounted } = useFreeTurns(
    'light-solution',
    userRole,
  );
  const { hasConsented, giveConsent, hydrated } = useConsent();
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    if (hydrated && !hasConsented) {
      setShowConsent(true);
    }
  }, [hydrated, hasConsented]);

  // 初始化：1 条 AI 欢迎气泡
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', content: INITIAL_AI_BUBBLE },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  // 当前正在打字回复的 AI 气泡 id（用于光标动画）
  const [aiMsgIdWatch, setAiMsgIdWatch] = useState<number | null>(null);
  // 付费墙弹窗
  const [paywallOpen, setPaywallOpen] = useState(false);
  // 禅意格言轮播索引
  const [zenIdx, setZenIdx] = useState(0);

  // 10 秒切换一次禅意格言
  useEffect(() => {
    const t = setInterval(() => setZenIdx((i) => (i + 1) % ZEN_QUOTES.length), 10000);
    return () => clearInterval(t);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const charQueueRef = useRef<string[]>([]);
  // 记录本次对话 AI 回复已流式累计的字符数（用 ref 避免闭包问题）
  const streamLenRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 计算"已完成的对话轮数"（用户消息数）
  const roundsCounted = messages.filter((m) => m.role === 'user').length;
  const showReport = roundsCounted >= TOTAL_ROUNDS;

  const scrollToBottom = useCallback(() => {
    // 用 container scrollTop 控制而不是 scrollIntoView，
    // 避免 sticky 底部元素被反复吸到视口内造成抖动
    const el = messagesContainerRef.current;
    if (el) {
      // 异步等 DOM 渲染完再滚
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, []);

  // 每次 messages 变化都滚到底
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // 同意弹窗
  const handleConsentConfirm = useCallback(() => {
    giveConsent();
    setShowConsent(false);
    fetch('/api/user/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: 'v1.0' }),
    }).catch(() => {});
  }, [giveConsent]);
  const handleConsentCancel = useCallback(() => {
    setShowConsent(false);
  }, []);

  // 从 localStorage 读 conversationId
  useEffect(() => {
    const saved = localStorage.getItem('conv_light-solution_uuid');
    if (saved) setConversationId(saved);
  }, []);

  // 流式打字
  const flushChars = useCallback(
    (assistantMessageId: number) => {
      if (timerRef.current) return;

      timerRef.current = setInterval(() => {
        if (charQueueRef.current.length === 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsTyping(false);
          setAiMsgIdWatch(null);
          return;
        }
        const char = charQueueRef.current.shift();
        if (char !== undefined) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: msg.content + char } : msg,
            ),
          );
        }
      }, 50);
    },
    [],
  );

  // 发送消息
  const handleSend = useCallback(
    async (text: string) => {
      const query = text.trim();
      if (!query || isTyping) return;

      // 配额守卫
      if (mounted && !trySend()) return;

      // 重置旧定时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      charQueueRef.current = [];
      streamLenRef.current = 0;

      // push 用户消息
      const userMsg: Message = { id: Date.now(), role: 'user', content: query };
      const aiMsgId = Date.now() + 1;
      const aiMsg: Message = { id: aiMsgId, role: 'assistant', content: '' };
      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setChatInput('');
      setIsTyping(true);
      setAiMsgIdWatch(aiMsgId);
      setError(null);

      // 4 次预兆：用户已发送第 4 条消息后，在 AI 回复末尾追加引导话术
      const userMsgCount = messages.filter((m) => m.role === 'user').length + 1;
      const needNudge = !isExempt && userMsgCount === 4;

      try {
        const response = await fetch('/api/dify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'light-solution',
            query,
            conversation_id: conversationId || '',
            inputs: {},
            user: 'lingjingge-user',
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `请求失败: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const data = JSON.parse(line.substring(6));
                if (data.conversation_id) {
                  setConversationId(data.conversation_id);
                  localStorage.setItem('conv_light-solution_uuid', data.conversation_id);
                }
                if (
                  (data.event === 'message' || data.event === 'agent_message') &&
                  data.answer
                ) {
                  streamLenRef.current += data.answer.length;
                  data.answer.split('').forEach((c: string) => charQueueRef.current.push(c));
                  flushChars(aiMsgId);
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }

        // 8s 超时保护：避免 Dify 端只返回极短占位时无限等待
        let totalAnswer = 0;
        const STREAM_TIMEOUT_MS = 8000;
        const streamDone = new Promise<void>((resolve) => {
          const check = setInterval(() => {
            totalAnswer = charQueueRef.current.length;
            if (totalAnswer === 0) {
              // 排空后稍等让 UI 走完动画
              setTimeout(() => { clearInterval(check); resolve(); }, 200);
            }
          }, 100);
          setTimeout(() => { clearInterval(check); resolve(); }, STREAM_TIMEOUT_MS);
        });
        await streamDone;

        // 内容过短兜底：Dify 端如果只回了 < 30 字符的占位（如"（轻轻推过去）"），
        // 前端追加本地"陪伴话术"让用户有内容可看、可继续对话
        if (streamLenRef.current < 30) {
          const fallback = '\n\n（云烟中传来轻柔的声音）\n我听到你了。\n能再多告诉我一些吗？比如——这件事发生多久了？\n是什么时候开始的？当时你有什么感受？';
          fallback.split('').forEach((c: string) => charQueueRef.current.push(c));
          if (!timerRef.current) flushChars(aiMsgId);
        }

        // 4 次预兆：流式结束后追加引导话术（让用户感到"被挽留"）
        if (needNudge) {
          await new Promise((r) => setTimeout(r, 400));
          RETENTION_NUDGE.split('').forEach((c) => charQueueRef.current.push(c));
          flushChars(aiMsgId);
        }
      } catch (err) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        charQueueRef.current = [];
        setIsTyping(false);
        setAiMsgIdWatch(null);
        const msg = err instanceof Error ? err.message : '请求失败，请稍后重试';
        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: '抱歉，信号被风吹散了。请再说一次好吗？' } : m,
          ),
        );
      }
    },
    [conversationId, flushChars, isTyping, mounted, trySend],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSend(chatInput);
  };

  // 快捷按钮：把文字填入输入框（不直接发送）
  const handleQuickPrompt = (text: string) => {
    setChatInput(text);
  };

  // 新对话
  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    charQueueRef.current = [];
    setMessages([{ id: 0, role: 'assistant', content: INITIAL_AI_BUBBLE }]);
    setChatInput('');
    setError(null);
    setIsTyping(false);
    setConversationId(null);
    localStorage.removeItem('conv_light-solution_uuid');
  };

  return (
    <>
      {showConsent && (
        <ConsentModal onConfirm={handleConsentConfirm} onCancel={handleConsentCancel} />
      )}

      <div
        className="flex flex-col min-h-screen relative overflow-hidden"
        style={{ backgroundColor: '#a8c4d4' }}
      >
        {/* 第一层：浅淡水墨晕染动态背景（CSS 动画，3 个圆斑缓慢漂移） */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute rounded-full blur-3xl opacity-30"
            style={{
              width: '520px',
              height: '520px',
              top: '-160px',
              left: '-120px',
              background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)',
              animation: 'inkDrift1 18s ease-in-out infinite',
            }}
          />
          <div
            className="absolute rounded-full blur-3xl opacity-25"
            style={{
              width: '480px',
              height: '480px',
              top: '40%',
              right: '-160px',
              background: 'radial-gradient(circle, #e0e8f0 0%, transparent 70%)',
              animation: 'inkDrift2 24s ease-in-out infinite',
            }}
          />
          <div
            className="absolute rounded-full blur-3xl opacity-20"
            style={{
              width: '440px',
              height: '440px',
              bottom: '-120px',
              left: '30%',
              background: 'radial-gradient(circle, #f5f0e8 0%, transparent 70%)',
              animation: 'inkDrift3 30s ease-in-out infinite',
            }}
          />
        </div>

        {/* Layer 2: 水墨 SVG 底纹（极淡，让蓝色背景不那么"冷"） */}
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="inkWash" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
              {/* 几笔抽象的"水墨晕染"形状 */}
              <path
                d="M 60 120 Q 120 60, 200 100 T 360 140 Q 380 200, 320 240 T 200 260 Q 120 280, 80 220 Z"
                fill="none"
                stroke="#1a1a2e"
                strokeWidth="1.5"
                opacity="0.5"
              />
              <path
                d="M 100 300 Q 180 280, 240 320 T 380 320"
                fill="none"
                stroke="#1a1a2e"
                strokeWidth="1"
                opacity="0.3"
              />
              <circle cx="320" cy="80" r="40" fill="#1a1a2e" opacity="0.08" />
              <ellipse cx="80" cy="380" rx="60" ry="30" fill="#1a1a2e" opacity="0.05" />
              {/* 一笔远山 */}
              <path
                d="M 0 220 Q 80 180, 160 200 T 320 180 T 400 200"
                fill="none"
                stroke="#1a1a2e"
                strokeWidth="0.8"
                opacity="0.4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#inkWash)" />
        </svg>

        {/* 顶部：标题 + 副标题 + AI 开场白 + 禅意格言 */}
        <header className="flex-shrink-0 relative z-10 px-4 sm:px-6 pt-6 pb-3 text-center">
          <div className="text-3xl mb-1">💭</div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-800"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            AI 解忧师
          </h1>
          <p
            className="text-gray-700 text-sm sm:text-base mt-1"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            把心事说出来，答案就藏在你心里
          </p>
          {/* 禅意格言（轮播，10 秒一切） */}
          <p
            key={zenIdx}
            className="text-gray-600/80 text-xs mt-2 italic"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", animation: 'zenFade 1.2s ease' }}
          >
            —— {ZEN_QUOTES[zenIdx]} ——
          </p>
          {/* 免费次数提示（数据源：useFreeTurns hook → 当前 localStorage；接入 Supabase user_activity 时替换数据源） */}
          <p
            className="text-xs text-gray-400 mt-2"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            {mounted
              ? isExempt
                ? '🌟 会员不限次数'
                : `今日剩余免费倾诉：${Math.max(remaining, 0)}/${limit} 次`
              : '正在加载…'}
          </p>
        </header>

        {/* 中部：聊天记录容器（可滚动） */}
        <main
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 relative z-10"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, idx) => {
              // 报告模式下：拆分 free / premium
              if (msg.role === 'assistant' && showReport && idx === messages.length - 1) {
                const parts = msg.content.split('PREMIUM:');
                const freePart = parts[0];
                const premiumPart = parts.length > 1 ? parts[1] : '';
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[85%] md:max-w-[75%] p-3 rounded-lg bg-white/85 shadow-sm">
                      <ReportPaywall
                        userRole={userRole}
                        freePart={freePart}
                        premiumPart={premiumPart}
                        premiumSections={REPORT_STRUCTURE.premium}
                        reportKey="light-solution"
                      />
                    </div>
                  </div>
                );
              }
              // 普通气泡
              return (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-lg shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gray-800 text-white'
                        : 'bg-white/85 text-gray-800'
                    }`}
                  >
                    <p
                      className="text-sm md:text-base whitespace-pre-wrap leading-relaxed"
                      style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                    >
                      {msg.content}
                      {isTyping && msg.id === aiMsgIdWatch && (
                        <span className="inline-block ml-1 animate-pulse">▍</span>
                      )}
                    </p>
                    {/* AI 气泡：显示"重新生成"小按钮（最后一轮 + 不在打字时） */}
                    {msg.role === 'assistant' && !isTyping && idx === messages.length - 1 && msg.id !== 0 && (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            // 找到上一条用户消息，重新发送
                            for (let i = idx - 1; i >= 0; i--) {
                              if (messages[i].role === 'user') {
                                // 移除当前 AI 气泡，重新触发 send
                                setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                                void handleSend(messages[i].content);
                                return;
                              }
                            }
                          }}
                          className="text-xs text-gray-500 hover:text-gray-800 underline"
                        >
                          🔄 重新生成
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-lg shadow-sm bg-white/85 text-gray-800">
                  <div className="flex gap-1" aria-label="解忧师正在倾听">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* 底部：快捷按钮 + sticky 输入区 + 解锁墙 */}
        <footer className="flex-shrink-0 sticky bottom-0 bg-blue-100/50 backdrop-blur p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-white/30 relative z-10">
          <div className="max-w-3xl mx-auto">
            {/* 5 次用完：解锁墙（替换输入区） */}
            {mounted && !isExempt && remaining <= 0 ? (
              <UnlockWall
                userRole={userRole}
                onUnlock={() => setPaywallOpen(true)}
                onRegister={() => (window.location.href = '/tong/signup')}
              />
            ) : (
              <>
                {/* 快捷倾诉按钮（始终显示在输入区上方） */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleQuickPrompt(p)}
                      disabled={isTyping}
                      className="px-3 py-1.5 text-xs sm:text-sm bg-white/70 border border-gray-300 rounded-full hover:bg-white hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                    >
                      🔹 {p}
                    </button>
                  ))}
                </div>

                {/* 输入框 + 发送 */}
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="把你的心事说给我听..."
                    disabled={isTyping}
                    className="flex-1 px-4 py-2.5 bg-white/90 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 disabled:bg-gray-100"
                    style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                  />
                  <button
                    type="submit"
                    disabled={isTyping || !chatInput.trim()}
                    className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 active:scale-95 active:opacity-80 transition-all duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                    style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                  >
                    {isTyping ? '倾听中…' : '发送'}
                  </button>
                </form>
              </>
            )}

            {/* 提示行：免费次数（3/5 格式）+ 重置按钮 */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-700">
              <span style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                {mounted ? (
                  isExempt ? (
                    '🌟 会员不限次数'
                  ) : (
                    <>
                      今日剩余免费倾诉：
                      <span className="font-semibold text-gray-900">
                        {Math.max(remaining, 0)}/{limit}
                      </span>{' '}
                      次
                    </>
                  )
                ) : (
                  '正在加载…'
                )}
                {mounted && remaining === 0 && !isExempt && (
                  <Link
                    href="/tong/signup"
                    className="ml-2 underline font-medium text-gray-800"
                  >
                    立即注册
                  </Link>
                )}
              </span>
              {messages.filter((m) => m.role === 'user').length > 0 && !isTyping && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="underline hover:text-gray-900"
                >
                  开始新的咨询
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>

      {/* 付费墙弹窗（5 次用完 + 点"立即解锁"时弹出） */}
      {paywallOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setPaywallOpen(false)}
        >
          <div
            className="relative max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPaywallOpen(false)}
              className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-white rounded-full shadow-lg text-gray-600 hover:text-gray-900 text-lg leading-none"
              aria-label="关闭"
            >
              ×
            </button>
            <ReportPaywall
              userRole={userRole}
              freePart="你今日的 5 次免费倾诉已用完。\n\n解忧师仍在，随时愿意继续陪伴你。\n\n解锁后即可继续对话，并可获得一份专属的解忧报告。"
              premiumPart="解锁后可继续与解忧师深度对话。\n\n完整会员权益包含：无限次倾诉 / 专属解忧报告 / 优先响应 / 历史对话回顾。"
              premiumSections={['无限次对话', '专属解忧报告', '优先响应', '历史回顾']}
              reportKey="light-solution"
            />
          </div>
        </div>
      )}

      {/* 全局动画 keyframes（水墨漂移 + 禅意淡入） */}
      <style jsx global>{`
        @keyframes inkDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, 40px) scale(1.1); }
        }
        @keyframes inkDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, -30px) scale(1.15); }
        }
        @keyframes inkDrift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -50px) scale(1.05); }
        }
        @keyframes zenFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 0.8; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

/** 5 次用完后的解锁墙（替换底部输入区） */
function UnlockWall({ userRole, onUnlock, onRegister }: { userRole: UserRole; onUnlock: () => void; onRegister: () => void }) {
  if (userRole === 'member' || userRole === 'admin') {
    // 已是会员，无限畅聊
    return null;
  }
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-5 mb-1">
      <div className="text-center mb-4">
        <div className="text-2xl mb-1">🪷</div>
        <h3
          className="text-lg font-bold text-gray-800"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
        >
          免费次数已用完，点击解锁
        </h3>
        <p
          className="text-gray-600 text-xs mt-1"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
        >
          解锁后，可继续与解忧师深度对话，并获得专属解忧报告
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onUnlock}
          className="px-4 py-3 bg-white border-2 border-gray-800 text-gray-800 rounded-xl hover:bg-gray-50 transition-colors"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
        >
          <div className="text-base font-bold">🧘 解锁单次</div>
          <div className="text-sm mt-0.5">9.9 元 / 次</div>
        </button>
        <button
          type="button"
          onClick={onUnlock}
          className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-colors shadow-md"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
        >
          <div className="text-base font-bold">🌟 开通会员</div>
          <div className="text-sm mt-0.5">29.9 元 / 月 · 无限畅聊</div>
        </button>
      </div>
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={onRegister}
          className="text-xs text-gray-500 underline hover:text-gray-800"
        >
          还没账号？免费注册
        </button>
      </div>
    </div>
  );
}
