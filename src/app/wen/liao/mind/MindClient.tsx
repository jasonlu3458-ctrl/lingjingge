'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useFreeTurns } from '@/hooks/useFreeTurns';
import { useConsent } from '@/hooks/useConsent';
import type { UserRole } from '@/lib/auth';

// =====================================================
//  常量
// =====================================================

/** 莫兰迪绿（低饱和度鼠尾草绿）三段渐变 */
const MORANDI_BG =
  'linear-gradient(180deg, #c8d6c0 0%, #b3c4ad 35%, #a4b89e 70%, #95a98f 100%)';

/** 沉浸式主色（用 forest / sage 系的莫兰迪色） */
const PALETTE = {
  heroTitle: '#3d4f3a',
  heroSub: '#6b7d68',
  bubbleUser: 'rgba(255, 255, 255, 0.78)',
  bubbleAi: 'rgba(255, 255, 255, 0.92)',
  textOnBubble: '#2d3a2a',
  textAi: '#2d3a2a',
  accent: '#7a9576',
  accentDeep: '#5a7559',
  inputBg: 'rgba(255, 255, 255, 0.92)',
  inputBorder: 'rgba(122, 149, 118, 0.35)',
  fontRound: '"Nunito", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, -apple-system, sans-serif',
};

/** 开场白：2 条 AI 气泡（产品要求：情感化、不用大白框） */
const INITIAL_AI_BUBBLES: { id: number; content: string }[] = [
  { id: 0, content: '你好，我是你的专属疗愈师。今天你过得怎么样？' },
  { id: 1, content: '不必拘束，我们可以从"今天发生了什么"聊起，也可以单纯地静静呆一会儿。' },
];

/** 情绪冷启动胶囊（点击后直接触发 AI 开场白，不是只填入输入框） */
const MOOD_CAPSULES = [
  { emoji: '💧', label: '我最近很难过', query: '我最近很难过，心里像被什么东西堵住了一样。', accent: 'from-sky-200/80 to-sky-100/80 border-sky-300/60 text-sky-800' },
  { emoji: '⚡', label: '我压力很大', query: '最近压力好大，工作 / 生活让我喘不过气。', accent: 'from-amber-200/80 to-amber-100/80 border-amber-300/60 text-amber-800' },
  { emoji: '🌫️', label: '我想静一静', query: '我现在只想静一静，不知道自己怎么了。', accent: 'from-stone-200/80 to-stone-100/80 border-stone-300/60 text-stone-800' },
];

/** 抽屉里的疗愈工具（从原 SelfHelpTools 抽出，呼吸/观想/动作） */
const HEALING_TOOLS = [
  {
    id: 'breath',
    title: '呼吸法引导',
    icon: '🌬️',
    description: '4-7-8 安神呼吸法，缓解焦虑、帮助入眠。',
    steps: [
      '找一个安静的角落，坐直或躺平。',
      '用鼻轻吸气，心里数 4 秒。',
      '屏住呼吸，心里数 7 秒。',
      '用嘴缓缓呼气，心里数 8 秒。',
      '重复 4 轮。感受身体在每一轮中更放松。',
    ],
  },
  {
    id: 'visualize',
    title: '观想冥想',
    icon: '🌅',
    description: '在心中升起一片晨光，温柔地照进情绪。',
    steps: [
      '闭眼，想象自己站在一片无边的草原。',
      '清晨的雾气慢慢散开，金色阳光洒下来。',
      '让光一点点进入你的头顶、眉心、心口。',
      '想象每照亮一处，那里僵硬的部位开始松动。',
      '停留 1-2 分钟，再缓缓睁开眼。',
    ],
  },
  {
    id: 'movement',
    title: '动作疗愈',
    icon: '🧘',
    description: '5 个简单动作，把身体里的郁结振开。',
    steps: [
      '肩部环绕：双肩向前 5 圈、向后 5 圈。',
      '颈侧拉伸：右耳贴右肩停 15 秒，换边。',
      '扩胸开肩：双手在背后交握，挺胸抬头 20 秒。',
      '猫牛式：四点跪姿，吸气塌腰、呼气拱背，重复 6 次。',
      '站立前屈：双脚分开，缓慢前屈垂吊 30 秒。',
    ],
  },
];

/** 今日情绪打卡：5 级表情（按 valence 从高到低） */
const MOOD_LEVELS = [
  { emoji: '😊', label: '平静', value: 5, color: '#7a9576' },
  { emoji: '😐', label: '一般', value: 4, color: '#a4b89e' },
  { emoji: '😔', label: '低落', value: 3, color: '#c8b88c' },
  { emoji: '😫', label: '煎熬', value: 2, color: '#c89c7a' },
  { emoji: '💢', label: '崩溃', value: 1, color: '#b87878' },
];

/** 5 次免费额度（与 useFreeTurns 默认一致） */
const FREE_TURN_LIMIT = 5;

// =====================================================
//  类型
// =====================================================

interface MindClientProps {
  userRole?: UserRole;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  /** 来自情绪胶囊的用户消息，会带胶囊的 emoji 前缀以便视觉区分 */
  moodEmoji?: string;
}

// =====================================================
//  主组件
// =====================================================

export default function MindClient({ userRole = 'free' }: MindClientProps) {
  const { used, remaining, isExempt, canSend, trySend, mounted } = useFreeTurns('healing', userRole);
  const { hasConsented, giveConsent, hydrated } = useConsent();
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    if (hydrated && !hasConsented) {
      setShowConsent(true);
    }
  }, [hydrated, hasConsented]);

  // 初始化：2 条 AI 开场白气泡（产品要求）
  const [messages, setMessages] = useState<Message[]>(
    INITIAL_AI_BUBBLES.map((b) => ({ id: b.id, role: 'assistant', content: b.content })),
  );
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [aiMsgIdWatch, setAiMsgIdWatch] = useState<number | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [usedMoodCount, setUsedMoodCount] = useState(0); // 记录已通过情绪胶囊触发的次数

  // 抽屉（浮动 🌿 按钮）
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<typeof HEALING_TOOLS[number] | null>(null);

  // 今日情绪打卡
  const [moodOpen, setMoodOpen] = useState(false);
  const [todayMood, setTodayMood] = useState<number | null>(null); // 1-5
  const [moodSaving, setMoodSaving] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const charQueueRef = useRef<string[]>([]);
  const streamLenRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 滚动到底
  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, drawerOpen, scrollToBottom]);

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
  const handleConsentCancel = useCallback(() => setShowConsent(false), []);

  // 恢复 conversationId
  useEffect(() => {
    const saved = localStorage.getItem('conv_healing_uuid');
    if (saved) setConversationId(saved);
  }, []);

  // 恢复今日情绪（按 localStorage 缓存 + 日期）
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem(`mood_${today}`);
      if (raw) {
        const v = parseInt(raw, 10);
        if (v >= 1 && v <= 5) setTodayMood(v);
      }
    } catch {
      /* noop */
    }
  }, []);

  // 流式打字机
  const flushChars = useCallback((assistantMessageId: number) => {
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
    }, 45);
  }, []);

  // 主发送：复用 LightSolutionClient 的 Dify SSE 解析模式
  const handleSend = useCallback(
    async (text: string, opts?: { moodEmoji?: string }) => {
      const query = text.trim();
      if (!query || isTyping) return;
      if (mounted && !trySend()) return;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      charQueueRef.current = [];
      streamLenRef.current = 0;

      const userMsg: Message = {
        id: Date.now(),
        role: 'user',
        content: query,
        moodEmoji: opts?.moodEmoji,
      };
      const aiMsgId = Date.now() + 1;
      const aiMsg: Message = { id: aiMsgId, role: 'assistant', content: '' };
      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setChatInput('');
      setIsTyping(true);
      setAiMsgIdWatch(aiMsgId);
      setError(null);

      try {
        const response = await fetch('/api/dify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'healing',
            query,
            conversation_id: conversationId || '',
            inputs: {
              user_query: query,
              real_name: '',
              mood: opts?.moodEmoji || '',
            },
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
                  localStorage.setItem('conv_healing_uuid', data.conversation_id);
                }
                if ((data.event === 'message' || data.event === 'agent_message') && data.answer) {
                  streamLenRef.current += data.answer.length;
                  data.answer.split('').forEach((c: string) => charQueueRef.current.push(c));
                  flushChars(aiMsgId);
                }
              } catch {
                /* ignore */
              }
            }
          }
        }

        // 8s 超时保护
        const STREAM_TIMEOUT_MS = 8000;
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (charQueueRef.current.length === 0) {
              setTimeout(() => { clearInterval(check); resolve(); }, 200);
            }
          }, 100);
          setTimeout(() => { clearInterval(check); resolve(); }, STREAM_TIMEOUT_MS);
        });

        // 短回答兜底
        if (streamLenRef.current < 30) {
          const fallback =
            '\n\n（轻轻呼出一口气）\n我在听。能再多告诉我一些吗？比如——这件事是从什么时候开始的？当时你有什么感受？';
          fallback.split('').forEach((c) => charQueueRef.current.push(c));
          if (!timerRef.current) flushChars(aiMsgId);
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
            m.id === aiMsgId
              ? { ...m, content: '抱歉，信号被风吹散了。请再说一次好吗？' }
              : m,
          ),
        );
      }
    },
    [conversationId, flushChars, isTyping, mounted, trySend],
  );

  // 情绪胶囊：直接触发 AI 开场白（不是填入输入框）
  const handleMoodCapsule = (m: typeof MOOD_CAPSULES[number]) => {
    if (isTyping) return;
    if (mounted && !trySend()) return;
    setUsedMoodCount((c) => c + 1);
    void handleSend(m.query, { moodEmoji: m.emoji });
  };

  // 浮动按钮 → 抽屉
  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => {
    setDrawerOpen(false);
    setActiveTool(null);
  };

  // 今日情绪打卡
  const handleSaveMood = async (value: number) => {
    setMoodSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(`mood_${today}`, String(value));
      setTodayMood(value);
      // 异步同步到 Supabase（未登录时会 401，但不影响本地打卡）
      fetch('/api/user/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'mood_log',
          metadata: { value, date: today, source: 'healing_page' },
        }),
      }).catch(() => {});
    } finally {
      setMoodSaving(false);
      setMoodOpen(false);
    }
  };

  // 新对话
  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    charQueueRef.current = [];
    setMessages(
      INITIAL_AI_BUBBLES.map((b) => ({ id: b.id, role: 'assistant', content: b.content })),
    );
    setChatInput('');
    setError(null);
    setIsTyping(false);
    setConversationId(null);
    localStorage.removeItem('conv_healing_uuid');
  };

  // 是否已用完 5 次免费额度
  const isExhausted = mounted && !isExempt && used >= FREE_TURN_LIMIT;
  const hasUserMessage = messages.some((m) => m.role === 'user');

  return (
    <>
      {showConsent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold mb-2" style={{ color: PALETTE.heroTitle }}>
              欢迎来到疗愈工作坊
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              在开始前请确认：你已了解本对话为 AI 辅助情感陪伴，<b>非心理咨询或医疗诊断</b>。若你正经历紧急危机，请拨打求助热线。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleConsentCancel}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                暂不同意
              </button>
              <button
                onClick={handleConsentConfirm}
                className="px-5 py-2 text-sm text-white rounded-lg"
                style={{ backgroundColor: PALETTE.accent }}
              >
                我了解了，开始
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 全屏沉浸背景：莫兰迪绿渐变 + 柔和光斑 */}
      <main
        className="flex flex-col min-h-screen relative overflow-hidden"
        style={{ background: MORANDI_BG, fontFamily: PALETTE.fontRound }}
      >
        {/* 顶部装饰光斑（CSS 缓慢漂移） */}
        <div
          className="absolute top-0 left-1/4 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)',
            filter: 'blur(40px)',
            animation: 'floatBlob 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
            filter: 'blur(50px)',
            animation: 'floatBlob 22s ease-in-out infinite reverse',
          }}
        />

        {/* 顶部：标题居中（与下方胶囊中轴对齐） + 右上角"今日情绪"按钮 */}
        <header className="relative z-10 px-4 sm:px-6 pt-6 pb-2 flex items-start justify-between">
          {/* 左 spacer（占位 · 让标题视觉居中） */}
          <div className="w-14 flex-shrink-0" aria-hidden="true" />
          {/* 标题块：绝对居中，永远在中轴上 */}
          <div className="absolute left-1/2 -translate-x-1/2 top-6 text-center">
            <h1
              className="text-3xl sm:text-4xl font-semibold tracking-wide leading-tight whitespace-nowrap"
              style={{ color: PALETTE.heroTitle }}
            >
              🧘 疗愈工作坊
            </h1>
            <p
              className="text-sm sm:text-base mt-1 tracking-wider"
              style={{ color: PALETTE.heroSub, letterSpacing: '0.05em' }}
            >
              给心灵一个休息的地方
            </p>
          </div>
          {/* 今日情绪打卡按钮（白色圆形模糊背景 + 毛玻璃） */}
          <div className="ml-3 mt-1 flex flex-col items-end">
            <button
              onClick={() => setMoodOpen(true)}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-white/80 backdrop-blur-md shadow-md active:scale-95 transition-all"
              style={{
                border: '1px solid rgba(122, 149, 118, 0.25)',
                boxShadow: '0 4px 14px rgba(95, 117, 89, 0.18)',
              }}
              title="记录今日情绪"
              aria-label="记录今日情绪"
            >
              <span className="text-xl leading-none">
                {todayMood ? MOOD_LEVELS.find((m) => m.value === todayMood)?.emoji : '🧘'}
              </span>
            </button>
            <span
              className="text-[11px] mt-1 font-medium"
              style={{ color: PALETTE.heroSub, letterSpacing: '0.04em' }}
            >
              {todayMood ? '已打卡' : '今日情绪'}
            </span>
            {/* 剩余次数：搬到右上角，字号略大 */}
            {!isExhausted && !isExempt && (
              <span
                className="text-[12px] mt-0.5 font-semibold"
                style={{ color: PALETTE.accentDeep, letterSpacing: '0.04em' }}
              >
                今日剩余 {remaining} / {FREE_TURN_LIMIT} 次
              </span>
            )}
          </div>
        </header>

        {/* 情绪胶囊栏（居中：标题 + 3 颗胶囊） */}
        {!hasUserMessage && (
          <div className="relative z-10 px-4 sm:px-6 mt-2 mb-4 text-center">
            <p
              className="text-xs mb-2.5"
              style={{ color: PALETTE.heroSub, letterSpacing: '0.08em' }}
            >
              · 此刻，你的感受是？
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {MOOD_CAPSULES.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => handleMoodCapsule(c)}
                  disabled={isTyping}
                  className={`px-4 py-2.5 rounded-full bg-gradient-to-br ${c.accent} text-sm font-medium hover:scale-[1.03] active:scale-95 disabled:opacity-50 transition-all border backdrop-blur-sm shadow-sm`}
                  style={{ letterSpacing: '0.05em' }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 聊天区：可滚动 */}
        <div
          ref={messagesContainerRef}
          className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 pb-32"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="max-w-2xl mx-auto py-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="relative max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm"
                  style={{
                    background:
                      m.role === 'user' ? PALETTE.bubbleUser : PALETTE.bubbleAi,
                    color: m.role === 'user' ? PALETTE.textOnBubble : PALETTE.textAi,
                    borderTopRightRadius: m.role === 'user' ? 4 : 20,
                    borderTopLeftRadius: m.role === 'assistant' ? 4 : 20,
                    border: '1px solid rgba(122, 149, 118, 0.15)',
                    lineHeight: 1.7,
                    letterSpacing: '0.03em',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.role === 'user' && m.moodEmoji && (
                    <div className="text-lg mb-1">{m.moodEmoji}</div>
                  )}
                  {m.content}
                  {isTyping && m.id === aiMsgIdWatch && (
                    <span
                      className="inline-block w-0.5 h-3.5 ml-1 align-middle"
                      style={{
                        background: PALETTE.accent,
                        animation: 'blink 1s steps(2) infinite',
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 浮动 🌿 按钮（右下角 · 白色圆形毛玻璃悬浮感） */}
        <button
          onClick={openDrawer}
          className="fixed z-30 bottom-24 right-5 w-14 h-14 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-2xl active:scale-95 transition-transform"
          style={{
            border: '1px solid rgba(122, 149, 118, 0.4)',
            boxShadow: '0 6px 20px rgba(95, 117, 89, 0.22), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
          aria-label="打开疗愈工具抽屉"
          title="呼吸 · 冥想 · 动作"
        >
          🌿
        </button>

        {/* 底部固定输入区（毛玻璃 + 渐变 + 胶囊形） */}
        <footer
          className="fixed bottom-0 left-0 right-0 z-20 px-3 sm:px-6 py-3 backdrop-blur-md"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.82) 100%)',
            borderTop: '1px solid rgba(122, 149, 118, 0.18)',
            boxShadow: '0 -4px 24px rgba(95, 117, 89, 0.10), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          <div className="max-w-2xl mx-auto">
            {isExhausted ? (
              /* 5 次后：付费墙软着陆（不再跳 signup，弹 ReportPaywall） */
              <div
                className="flex items-center gap-2 px-5 py-3 rounded-full"
                style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(122, 149, 118, 0.25)' }}
              >
                <span className="text-lg">🌸</span>
                <p className="flex-1 text-sm" style={{ color: PALETTE.heroTitle }}>
                  今天的深度倾诉时间已满。
                  <button
                    onClick={() => setPaywallOpen(true)}
                    className="ml-1 underline font-medium"
                    style={{ color: PALETTE.accentDeep }}
                  >
                    点击这里了解会员
                  </button>
                  ，或者明天再来找我。
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend(chatInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="此刻，你在想什么？"
                  disabled={isTyping}
                  className="flex-1 px-5 py-3 rounded-full outline-none transition-all"
                  style={{
                    background: PALETTE.inputBg,
                    border: `1px solid ${PALETTE.inputBorder}`,
                    minHeight: 48, // ≥ 44px 移动端单手操作
                    color: PALETTE.textAi,
                    fontFamily: PALETTE.fontRound,
                    letterSpacing: '0.03em',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend(chatInput);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isTyping || !chatInput.trim()}
                  className="px-6 py-3 rounded-full text-white font-medium transition-all active:scale-95 disabled:opacity-40 shadow-sm"
                  style={{
                    background: PALETTE.accent,
                    minHeight: 48,
                    minWidth: 72,
                    fontFamily: PALETTE.fontRound,
                  }}
                >
                  倾诉
                </button>
                {hasUserMessage && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-sm w-10 h-12 rounded-full flex items-center justify-center"
                    style={{ color: PALETTE.heroSub }}
                    title="开始新对话"
                  >
                    ↻
                  </button>
                )}
              </form>
            )}
            {/* 剩余次数已搬到右上角（header 下方），footer 不再展示 */}
          </div>
        </footer>

        {/* 抽屉：呼吸 / 冥想 / 动作 */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-end"
            onClick={closeDrawer}
          >
            <div
              className="w-full rounded-t-3xl p-5 pb-8 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'rgba(255,255,255,0.95)' }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'rgba(0,0,0,0.15)' }} />
              <h3 className="text-lg font-semibold mb-1" style={{ color: PALETTE.heroTitle }}>
                🌿 呼吸 · 急救站
              </h3>
              <p className="text-xs mb-4" style={{ color: PALETTE.heroSub }}>
                需要立刻缓一缓？挑一个工具，跟我做 3 分钟。
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {HEALING_TOOLS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTool(t)}
                    className="text-left p-4 rounded-2xl border hover:scale-[1.02] active:scale-95 transition-transform"
                    style={{ borderColor: 'rgba(122, 149, 118, 0.3)' }}
                  >
                    <div className="text-2xl mb-1">{t.icon}</div>
                    <div className="font-medium text-sm" style={{ color: PALETTE.heroTitle }}>
                      {t.title}
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: PALETTE.heroSub }}>
                      {t.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 工具详情 modal（叠加在抽屉上） */}
        {activeTool && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setActiveTool(null)}
          >
            <div
              className="w-full max-w-md bg-white rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="text-4xl">{activeTool.icon}</div>
                <h3 className="text-xl font-semibold mt-2" style={{ color: PALETTE.heroTitle }}>
                  {activeTool.title}
                </h3>
                <p className="text-xs mt-1" style={{ color: PALETTE.heroSub }}>
                  {activeTool.description}
                </p>
              </div>
              <ol className="space-y-3 text-sm" style={{ color: PALETTE.textAi, lineHeight: 1.7 }}>
                {activeTool.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold"
                      style={{ background: PALETTE.accent }}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1">{s}</span>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => setActiveTool(null)}
                className="mt-6 w-full py-3 rounded-2xl text-white font-medium"
                style={{ background: PALETTE.accent }}
              >
                准备好了，回到对话
              </button>
            </div>
          </div>
        )}

        {/* 今日情绪打卡 modal */}
        {moodOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setMoodOpen(false)}
          >
            <div
              className="w-full max-w-sm bg-white rounded-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-1 text-center" style={{ color: PALETTE.heroTitle }}>
                🧘 今日情绪
              </h3>
              <p className="text-xs text-center mb-5" style={{ color: PALETTE.heroSub }}>
                30 秒打卡 · 让 AI 看见你的每一天
              </p>
              <div className="flex justify-between items-center gap-1">
                {MOOD_LEVELS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => void handleSaveMood(m.value)}
                    disabled={moodSaving}
                    className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                    style={{
                      background: todayMood === m.value ? `${m.color}30` : 'transparent',
                      border: todayMood === m.value ? `1.5px solid ${m.color}` : '1.5px solid transparent',
                    }}
                    title={m.label}
                  >
                    <span className="text-3xl">{m.emoji}</span>
                    <span className="text-[10px]" style={{ color: PALETTE.heroSub }}>
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setMoodOpen(false)}
                className="mt-4 w-full py-2 text-sm"
                style={{ color: PALETTE.heroSub }}
              >
                稍后再说
              </button>
            </div>
          </div>
        )}

        {/* 付费墙（5 次用完后轻量引导） */}
        {paywallOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPaywallOpen(false)}
          >
            <div
              className="w-full max-w-sm bg-white rounded-3xl p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-4xl mb-2">🌸</div>
              <h3 className="text-lg font-semibold" style={{ color: PALETTE.heroTitle }}>
                今天的陪伴时间已满
              </h3>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: PALETTE.heroSub }}>
                想继续这场疗愈对话？<br />
                开通会员获得无限制陪伴 + 专属疗愈报告。
              </p>
              <div className="flex flex-col gap-2 mt-5">
                <Link
                  href="/tong/pricing"
                  className="w-full py-3 rounded-2xl text-white font-medium"
                  style={{ background: PALETTE.accent }}
                  onClick={() => setPaywallOpen(false)}
                >
                  了解会员
                </Link>
                <Link
                  href="/tong/signup?redirect=/wen/liao/mind"
                  className="w-full py-3 rounded-2xl text-sm"
                  style={{ color: PALETTE.accentDeep, border: `1px solid ${PALETTE.accent}` }}
                  onClick={() => setPaywallOpen(false)}
                >
                  免费注册，解锁今日剩余
                </Link>
                <button
                  onClick={() => setPaywallOpen(false)}
                  className="text-xs mt-1"
                  style={{ color: PALETTE.heroSub }}
                >
                  明天再来
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 内联关键帧 */}
        <style jsx>{`
          @keyframes floatBlob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(20px, -30px) scale(1.05); }
            66% { transform: translate(-15px, 20px) scale(0.95); }
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}</style>
      </main>
    </>
  );
}
