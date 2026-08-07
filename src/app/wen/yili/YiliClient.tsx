'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFreeTurns } from '@/hooks/useFreeTurns';
import { useConsent } from '@/hooks/useConsent';
import ConsentModal from '@/components/ConsentModal';
import ReportPaywall from '@/components/ReportPaywall';
import type { UserRole } from '@/lib/auth';

// =====================================================
//  AI 易理师  ——  仪式化交互（三阶段）
//  phase: 'form' → 'animating' → 'result'
// =====================================================

/** 64 卦（周易顺序）· 卦名 + Unicode 卦符 + 简短释义 */
const HEXAGRAM_LIST: Array<{ name: string; symbol: string; judge: string; meaning: string }> = [
  { name: '乾为天',     symbol: '䷀', judge: '元亨利贞', meaning: '刚健中正，自强不息' },
  { name: '坤为地',     symbol: '䷁', judge: '元亨，利牝马之贞', meaning: '柔顺包容，厚德载物' },
  { name: '水雷屯',     symbol: '䷂', judge: '元亨利贞，勿用有攸往', meaning: '起始艰难，守正待机' },
  { name: '山水蒙',     symbol: '䷃', judge: '亨，匪我求童蒙', meaning: '蒙昧渐开，启发童蒙' },
  { name: '水天需',     symbol: '䷄', judge: '有孚，光亨，贞吉', meaning: '守候等待，时机将至' },
  { name: '天水讼',     symbol: '䷅', judge: '有孚，窒惕', meaning: '争讼不利，以和为贵' },
  { name: '地水师',     symbol: '䷆', judge: '贞，丈人吉', meaning: '军旅之事，统众得人' },
  { name: '水地比',     symbol: '䷇', judge: '吉，原筮元永贞', meaning: '亲比辅佐，团结吉祥' },
  { name: '风天小畜',   symbol: '䷈', judge: '亨，密云不雨', meaning: '小有积蓄，待时而发' },
  { name: '天泽履',     symbol: '䷉', judge: '履虎尾，不咥人', meaning: '如履薄冰，谨慎行事' },
  { name: '地天泰',     symbol: '䷊', judge: '小往大来，吉亨', meaning: '通泰安和，上下交感' },
  { name: '天地否',     symbol: '䷋', judge: '否之匪人', meaning: '闭塞不通，君子待时' },
  { name: '天火同人',   symbol: '䷌', judge: '同人于野，亨', meaning: '和同于人，志同道合' },
  { name: '火天大有',   symbol: '䷍', judge: '元亨', meaning: '大有所获，光明盛大' },
  { name: '地山谦',     symbol: '䷎', judge: '亨，君子有终', meaning: '谦下有容，终成大业' },
  { name: '雷地豫',     symbol: '䷏', judge: '利建侯行师', meaning: '顺势而动，喜乐豫备' },
  { name: '泽雷随',     symbol: '䷐', judge: '元亨利贞', meaning: '随顺时势，随遇而安' },
  { name: '山风蛊',     symbol: '䷑', judge: '元亨，利涉大川', meaning: '整治弊端，振民育德' },
  { name: '地泽临',     symbol: '䷒', judge: '元亨利贞', meaning: '居上临下，教化施治' },
  { name: '风地观',     symbol: '䷓', judge: '盥而不荐', meaning: '仰观俯察，观风俗化' },
  { name: '火雷噬嗑',   symbol: '䷔', judge: '亨，利用狱', meaning: '咬合阻碍，惩奸除恶' },
  { name: '山火贲',     symbol: '䷕', judge: '亨，小利有攸往', meaning: '文饰修养，质朴为本' },
  { name: '山地剥',     symbol: '䷖', judge: '不利有攸往', meaning: '层层剥落，顺势止止' },
  { name: '地雷复',     symbol: '䷗', judge: '亨，出入无疾', meaning: '一阳来复，万物复苏' },
  { name: '天雷无妄',   symbol: '䷘', judge: '元亨利贞', meaning: '无妄真心，顺乎自然' },
  { name: '山天大畜',   symbol: '䷙', judge: '利贞，不家食吉', meaning: '大为蓄养，止而不止' },
  { name: '山雷颐',     symbol: '䷚', judge: '贞吉，观颐', meaning: '颐养身心，养正则吉' },
  { name: '泽风大过',   symbol: '䷛', judge: '栋桡，利有攸往', meaning: '非常行动，独立不惧' },
  { name: '坎为水',     symbol: '䷜', judge: '习坎，有孚', meaning: '重重险难，重险守正' },
  { name: '离为火',     symbol: '䷝', judge: '利贞，亨', meaning: '光明依附，附丽得所' },
  { name: '泽山咸',     symbol: '䷞', judge: '亨，利贞，取女吉', meaning: '感应相和，两情相悦' },
  { name: '雷风恒',     symbol: '䷟', judge: '亨，无咎利贞', meaning: '恒久之道，立不易方' },
  { name: '天山遁',     symbol: '䷠', judge: '亨，小利贞', meaning: '退避隐遁，适时退让' },
  { name: '雷天大壮',   symbol: '䷡', judge: '利贞', meaning: '阳气壮盛，慎用其刚' },
  { name: '火地晋',     symbol: '䷢', judge: '康侯用锡马蕃庶', meaning: '日出地上，前进上升' },
  { name: '地火明夷',   symbol: '䷣', judge: '利艰贞', meaning: '光明受伤，韬光养晦' },
  { name: '风火家人',   symbol: '䷤', judge: '利女贞', meaning: '治家之道，各得其位' },
  { name: '火泽睽',     symbol: '䷥', judge: '小事吉', meaning: '相违相睽，求同存异' },
  { name: '水山蹇',     symbol: '䷦', judge: '利西南，不利东北', meaning: '前路险阻，反身修德' },
  { name: '雷水解',     symbol: '䷧', judge: '利西南', meaning: '舒解险难，赦过宥罪' },
  { name: '山泽损',     symbol: '䷨', judge: '有孚，元吉', meaning: '损下益上，惩忿窒欲' },
  { name: '风雷益',     symbol: '䷩', judge: '利有攸往，利涉大川', meaning: '损上益下，见善则迁' },
  { name: '泽天夬',     symbol: '䷪', judge: '扬于王庭', meaning: '决断果决，柔行刚断' },
  { name: '天风姤',     symbol: '䷫', judge: '女壮，勿用取女', meaning: '偶然相遇，防微杜渐' },
  { name: '泽地萃',     symbol: '䷬', judge: '亨，王假有庙', meaning: '聚集萃集，凝聚人心' },
  { name: '地风升',     symbol: '䷭', judge: '元亨，用见大人', meaning: '柔顺上升，积小成大' },
  { name: '泽水困',     symbol: '䷮', judge: '亨，贞，大人吉', meaning: '困顿穷乏，穷则思变' },
  { name: '水风井',     symbol: '䷯', judge: '改邑不改井', meaning: '井养而不穷，安民养德' },
  { name: '泽火革',     symbol: '䷰', judge: '己日乃孚', meaning: '革故鼎新，与时俱进' },
  { name: '火风鼎',     symbol: '䷱', judge: '元吉，亨', meaning: '鼎新革故，稳定调和' },
  { name: '震为雷',     symbol: '䷲', judge: '亨，震来虩虩', meaning: '雷动震惊，警惧修省' },
  { name: '艮为山',     symbol: '䷳', judge: '艮其背，不获其身', meaning: '止于至善，安分不妄' },
  { name: '风山渐',     symbol: '䷴', judge: '女归吉，利贞', meaning: '循序渐进，渐次而进' },
  { name: '雷泽归妹',   symbol: '䷵', judge: '征凶，无攸利', meaning: '婚嫁归宿，慎始慎终' },
  { name: '雷火丰',     symbol: '䷶', judge: '亨，王假之', meaning: '盛大丰盛，盛大易衰' },
  { name: '火山旅',     symbol: '䷷', judge: '小亨，旅贞吉', meaning: '行旅在外，柔顺持中' },
  { name: '巽为风',     symbol: '䷸', judge: '小亨，利有攸往', meaning: '顺风而入，谦逊柔顺' },
  { name: '兑为泽',     symbol: '䷹', judge: '亨，利贞', meaning: '悦泽万物，和悦相处' },
  { name: '风水涣',     symbol: '䷺', judge: '亨，王假有庙', meaning: '涣散流布，化解离散' },
  { name: '水泽节',     symbol: '䷻', judge: '亨，苦节不可贞', meaning: '节制有度，恰到好处' },
  { name: '风泽中孚',   symbol: '䷼', judge: '豚鱼吉，利涉大川', meaning: '中心诚信，感化万物' },
  { name: '雷山小过',   symbol: '䷽', judge: '亨，利贞', meaning: '小有过越，谨小慎微' },
  { name: '水火既济',   symbol: '䷾', judge: '亨小，利贞', meaning: '事已成就，慎守成功' },
  { name: '火水未济',   symbol: '䷿', judge: '亨，小狐汔济', meaning: '事未成就，慎终如始' },
];

/** 三枚铜钱：抛掷后正反结果（用于仪式动画） */
const COIN_RESULT = ['正', '反', '正', '反'] as const;

/** 三个预设问题胶囊 */
const QUICK_QUESTIONS = [
  { label: '💰 财运', text: '我今年的财运如何？' },
  { label: '💞 姻缘', text: '我和他（她）的姻缘如何？' },
  { label: '💼 工作', text: '最近工作是否顺利？' },
];

type Phase = 'form' | 'animating' | 'result';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

interface YiliClientProps {
  userRole?: UserRole;
}

export default function YiliClient({ userRole = 'free' }: YiliClientProps) {
  // —— 阶段状态 ——
  const [phase, setPhase] = useState<Phase>('form');
  const [realName, setRealName] = useState('');
  const [question, setQuestion] = useState('');
  const [currentHexagram, setCurrentHexagram] = useState<typeof HEXAGRAM_LIST[number] | null>(null);
  const [coinResults, setCoinResults] = useState<string[]>([]);

  // —— 仪式动画内部阶段：起卦前摇(0.3s) → 抛掷(2.5s) → 落地悬停(1.5s) → 淡出(0.5s) = 共 4.8s ——
  type AnimStage = 'flash' | 'tossing' | 'hovering' | 'fading';
  const [animStage, setAnimStage] = useState<AnimStage>('flash');

  // —— 流式对话（result 阶段） ——
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // —— 付费墙弹窗 ——
  const [paywallOpen, setPaywallOpen] = useState(false);

  // —— 同意弹窗 ——
  const { hasConsented, giveConsent, hydrated } = useConsent();
  const [showConsent, setShowConsent] = useState(false);
  useEffect(() => {
    if (hydrated && !hasConsented) setShowConsent(true);
  }, [hydrated, hasConsented]);

  // —— 免费次数 ——
  const { used, limit, remaining, isExempt, canSend, trySend, mounted } = useFreeTurns('yili', userRole);

  // —— 打字机流式 ——
  const charQueueRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamLenRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // —— 同意弹窗处理 ——
  const handleConsentConfirm = useCallback(() => {
    giveConsent();
    setShowConsent(false);
    fetch('/api/user/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: 'v1.0' }) }).catch(() => {});
  }, [giveConsent]);

  // —— 滚动到底 ——
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // —— 打字机渲染 ——
  const flushChars = useCallback((assistantMessageId: number) => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      if (charQueueRef.current.length === 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
      const ch = charQueueRef.current.shift();
      if (ch !== undefined) {
        streamLenRef.current += 1;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? { ...m, content: m.content + ch } : m))
        );
      }
    }, 45);
  }, []);

  // —— 起卦动作 ——
  const handleStart = () => {
    if (!realName.trim() || !question.trim()) {
      setError('请填写姓名与所问之事');
      return;
    }
    setError(null);
    // 1) 抽一卦
    const hex = HEXAGRAM_LIST[Math.floor(Math.random() * HEXAGRAM_LIST.length)];
    setCurrentHexagram(hex);
    // 2) 生成三枚铜钱结果（仪式占位）
    const coins = Array.from({ length: 3 }, () => COIN_RESULT[Math.floor(Math.random() * COIN_RESULT.length)]);
    setCoinResults(coins);
    // 3) 切换到 animating（从 'flash' 前摇阶段开始）
    setPhase('animating');
    setAnimStage('flash');
    // 4) 阶段时序：0.3s 黑暗前摇 → 2.5s 抛掷 → 1.5s 落地悬停 → 0.5s 淡出 = 4.8s
    setTimeout(() => setAnimStage('tossing'), 300);
    setTimeout(() => setAnimStage('hovering'), 3000);   // 300 + 2500
    setTimeout(() => setAnimStage('fading'), 4500);     // +1500 悬停
    setTimeout(() => {
      setPhase('result');
      // 5) 直接调 Dify 解读，不再往对话区 push 姓名/问题 user 消息
      void streamInitialReading(hex, realName, question);
    }, 4800);
  };

  /** 起卦后的初次解读（直接流式调 Dify） */
  const streamInitialReading = async (hex: typeof HEXAGRAM_LIST[number], name: string, q: string) => {
    setIsTyping(true);
    const assistantMessageId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

    const queryText = `我刚起了一卦：「${hex.name}」（${hex.symbol}），卦辞：${hex.judge}。我的问题是：${q}。请为我详解此卦。`;
    const ok = trySend();
    if (!ok) {
      setIsTyping(false);
      setMessages((prev) => prev.map((m) => (m.id === assistantMessageId ? { ...m, content: '今日免费次数已用完，请解锁后继续。' } : m)));
      setPaywallOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'yili',
          query: queryText,
          conversation_id: conversationId || '',
          inputs: {
            real_name: name,
            question: q,
            hexagram_name: hex.name,
            hexagram_symbol: hex.symbol,
            hexagram_judge: hex.judge,
          },
          user: 'lingjingge-user',
        }),
      });
      if (!res.ok || !res.body) throw new Error(`Dify 代理失败: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let convId: string | null = null;

      // 8s 超时保护（仪式页面同步）
      const timeoutPromise = new Promise<void>((resolve) => setTimeout(() => resolve(), 8000));
      const readPromise = (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (!json || json === '[DONE]') continue;
            try {
              const data = JSON.parse(json);
              if (data.conversation_id && !convId) {
                convId = data.conversation_id;
                setConversationId(convId);
                localStorage.setItem('conv_yili_uuid', convId as string);
              }
              if ((data.event === 'message' || data.event === 'agent_message') && data.answer) {
                for (const c of data.answer) charQueueRef.current.push(c);
              }
            } catch {}
          }
        }
      })();
      await Promise.race([readPromise, timeoutPromise]);

      flushChars(assistantMessageId);

      // 兜底说明：仅在卦象卡下方显示一次（已由 Dify 内容承担，不在 chat 中重复）
      // —— 不再在 chat queue 中追加【本地补注】——

      // 等待打字机走完
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (charQueueRef.current.length === 0 && !timerRef.current) {
            clearInterval(check);
            resolve();
          }
        }, 100);
        setTimeout(() => { clearInterval(check); resolve(); }, 8000);
      });
    } catch (e) {
      const fallback = `${hex.name}，${hex.meaning}。卦辞「${hex.judge}」——所问之事需静观其变。`;
      setMessages((prev) => prev.map((m) => (m.id === assistantMessageId ? { ...m, content: fallback } : m)));
      setError('解忧师暂未响应，已为你呈现本地解读。');
    } finally {
      setIsTyping(false);
    }
  };

  /** result 阶段用户继续对话 */
  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;
    if (mounted && remaining <= 0 && !isExempt) {
      setPaywallOpen(true);
      return;
    }
    setChatInput('');
    const userMessage: Message = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    const assistantMessageId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);
    streamLenRef.current = 0;
    charQueueRef.current = [];

    try {
      const res = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'yili',
          query: text,
          conversation_id: conversationId || '',
          inputs: { real_name: realName, hexagram_name: currentHexagram?.name || '' },
          user: 'lingjingge-user',
        }),
      });
      if (!res.ok || !res.body) throw new Error(`Dify ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (!json || json === '[DONE]') continue;
          try {
            const data = JSON.parse(json);
            if (data.conversation_id && !conversationId) {
              setConversationId(data.conversation_id);
              localStorage.setItem('conv_yili_uuid', data.conversation_id);
            }
            if ((data.event === 'message' || data.event === 'agent_message') && data.answer) {
              for (const c of data.answer) charQueueRef.current.push(c);
            }
          } catch {}
        }
      }
      flushChars(assistantMessageId);
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (charQueueRef.current.length === 0 && !timerRef.current) { clearInterval(check); resolve(); }
        }, 100);
        setTimeout(() => { clearInterval(check); resolve(); }, 8000);
      });
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m.id === assistantMessageId ? { ...m, content: '（解忧师暂未回应，请稍后再试）' } : m)));
      setError('解忧师暂未响应。');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-b from-[#8b7d5c] to-[#6a5d3a] text-[#3a2f1a]">
        {/* Layer 1: 太极/八卦 SVG 底纹（极淡，opacity 0.03） */}
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full"
          style={{ opacity: 0.05 }}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="bagua" x="0" y="0" width="240" height="240" patternUnits="userSpaceOnUse">
              {/* 太极图（极简） */}
              <g transform="translate(60,60)">
                <circle r="40" fill="none" stroke="#1a1208" strokeWidth="1.2" />
                <path d="M 0 -40 A 40 40 0 0 1 0 40 A 20 20 0 0 1 0 0 A 20 20 0 0 0 0 -40" fill="#1a1208" opacity="0.3" />
                <circle cx="0" cy="-20" r="4" fill="#fff" opacity="0.5" />
                <circle cx="0" cy="20" r="4" fill="#1a1208" opacity="0.5" />
              </g>
              {/* 八卦卦符 */}
              <g transform="translate(160,40)" fill="#1a1208" opacity="0.25">
                <rect x="0" y="0" width="40" height="4" />
                <rect x="0" y="8" width="40" height="4" />
                <rect x="0" y="16" width="40" height="4" />
              </g>
              <g transform="translate(160,90)" fill="#1a1208" opacity="0.2">
                <rect x="0" y="0" width="40" height="4" />
                <rect x="0" y="8" width="40" height="4" />
                <rect x="0" y="16" width="14" height="4" />
                <rect x="22" y="16" width="14" height="4" />
              </g>
              <g transform="translate(160,140)" fill="#1a1208" opacity="0.18">
                <rect x="0" y="0" width="14" height="4" />
                <rect x="22" y="0" width="14" height="4" />
                <rect x="0" y="8" width="14" height="4" />
                <rect x="22" y="8" width="14" height="4" />
                <rect x="0" y="16" width="14" height="4" />
                <rect x="22" y="16" width="14" height="4" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bagua)" />
        </svg>

        {/* 顶部标题（三个阶段都显示） */}
        <header className="relative z-10 flex-shrink-0 px-4 sm:px-6 pt-6 pb-3 text-center">
          <div className="text-3xl mb-1">☯️</div>
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#f5ecd9' }}
          >
            AI 易理师
          </h1>
          <p
            className="text-sm mt-1"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#e8d8b0' }}
          >
            起一智慧指引，答你心中惑
          </p>
          <p
            className="text-xs mt-2"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#c9b888' }}
          >
            {mounted
              ? isExempt
                ? '🌟 会员不限次数'
                : `今日剩余免费问卦：${Math.max(remaining, 0)}/${limit} 次`
              : '正在加载…'}
          </p>
        </header>

        {/* 阶段渲染 */}
        {phase === 'form' && (
          <FormPhase
            realName={realName}
            setRealName={setRealName}
            question={question}
            setQuestion={setQuestion}
            onStart={handleStart}
            error={error}
          />
        )}

        {phase === 'animating' && <AnimatingPhase coinResults={coinResults} animStage={animStage} />}

        {phase === 'result' && currentHexagram && (
          <ResultPhase
            hexagram={currentHexagram}
            realName={realName}
            question={question}
            messages={messages}
            setMessages={setMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            isTyping={isTyping}
            error={error}
            onSend={handleSend}
            messagesEndRef={messagesEndRef}
            remaining={remaining}
            isExempt={isExempt}
            onUnlock={() => setPaywallOpen(true)}
            mounted={mounted}
          />
        )}

        {/* 全局动画 keyframes */}
        <style jsx global>{`
          /* 起卦前摇：黑暗/模糊 0.3s */
          @keyframes flashOverlayIn {
            from { opacity: 0; backdrop-filter: blur(0px); }
            to   { opacity: 1; backdrop-filter: blur(8px); }
          }
          @keyframes flashOverlayOut {
            from { opacity: 1; backdrop-filter: blur(8px); }
            to   { opacity: 0; backdrop-filter: blur(0px); }
          }
          /* 铜钱从黑暗中淡入 */
          @keyframes coinAppear {
            0%   { opacity: 0; filter: blur(8px) brightness(0.3); }
            100% { opacity: 1; filter: blur(0) brightness(1); }
          }
          /* 铜钱抛掷：2.5s + 4 圈侧翻（rotateY 模拟真实翻面）+ 落地回弹 */
          @keyframes coinToss {
            0%   { transform: translate(0, 0)     rotateY(0deg)   scale(0.8);  }
            6%   { transform: translate(10px, -40px)  rotateY(90deg)  scale(0.95); }   /* 第一次侧翻 */
            12%  { transform: translate(20px, -90px)  rotateY(180deg) scale(1.1);  }
            18%  { transform: translate(25px, -130px) rotateY(270deg) scale(1.15); }  /* 最高点 */
            25%  { transform: translate(20px, -160px) rotateY(360deg) scale(1.15); }  /* 第 1 圈完 */
            35%  { transform: translate(-10px, -180px) rotateY(540deg) scale(1.15); }
            50%  { transform: translate(-30px, -150px) rotateY(720deg) scale(1.12); }  /* 第 2 圈完 */
            65%  { transform: translate(-15px, -100px) rotateY(900deg) scale(1.05); }
            78%  { transform: translate(0, -50px)    rotateY(1080deg) scale(1.0);  }   /* 第 3 圈完 */
            88%  { transform: translate(0, -15px)    rotateY(1260deg) scale(1.03); }   /* 落地前回弹 */
            94%  { transform: translate(0, -5px)     rotateY(1350deg) scale(1.02); }   /* 二次小回弹 */
            100% { transform: translate(0, 0)        rotateY(1440deg) scale(1);    }  /* 第 4 圈完 + 砸到桌面 */
          }
          /* 落地后静态：轻微浮动 */
          @keyframes coinRest {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50%      { transform: translate(0, -3px) scale(1.01); }
          }
          /* 落地后光晕扩散 */
          @keyframes glowPulse {
            0%   { opacity: 0; transform: scale(0.5); }
            50%  { opacity: 0.6; transform: scale(1.3); }
            100% { opacity: 0; transform: scale(1.8); }
          }
          /* 铜钱整体淡出 */
          @keyframes coinFadeOut {
            from { opacity: 1; }
            to   { opacity: 0; transform: scale(0.85); }
          }
          @keyframes coinFadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .animate-coin {
            animation: coinToss 2.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards;
            transform-origin: center;
          }
          .animate-coin-rest {
            animation: coinRest 1.5s ease-in-out infinite;
            transform-origin: center;
          }
          .animate-coin-appear {
            animation: coinAppear 0.5s ease-out forwards;
          }
          .animate-coin-fadeout {
            animation: coinFadeOut 0.5s ease-in forwards;
          }
          .animate-glow {
            animation: glowPulse 1.5s ease-out infinite;
          }
          .animate-flash-in {
            animation: flashOverlayIn 0.3s ease-out forwards;
          }
          .animate-flash-out {
            animation: flashOverlayOut 0.3s ease-in forwards;
          }
          .animate-fade-in {
            animation: coinFadeIn 0.8s ease-out forwards;
          }
        `}</style>
      </div>

      {/* 同意弹窗 */}
      {showConsent && (
        <ConsentModal
          onConfirm={handleConsentConfirm}
          onCancel={() => setShowConsent(false)}
        />
      )}

      {/* 付费墙弹窗 */}
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
              freePart="你今日的 5 次免费问卦已用完。\n\n易理师仍在，随时愿意继续解卦。\n\n解锁后即可继续问卦，并可获得一份专属的解卦报告。"
              premiumPart="解锁后可继续问卦。\n\n完整会员权益包含：无限次问卦 / 专属解卦报告 / 优先响应 / 历史回顾。"
              premiumSections={['无限次问卦', '专属解卦报告', '优先响应', '历史回顾']}
              reportKey="yili"
            />
          </div>
        </div>
      )}
    </>
  );
}

// =====================================================
//  子组件：form 阶段
// =====================================================
function FormPhase({
  realName,
  setRealName,
  question,
  setQuestion,
  onStart,
  error,
}: {
  realName: string;
  setRealName: (v: string) => void;
  question: string;
  setQuestion: (v: string) => void;
  onStart: () => void;
  error: string | null;
}) {
  return (
    <main className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-4">
      <div className="max-w-2xl mx-auto">
        {/* 副标题：易经风文案 */}
        <p
          className="text-center text-base sm:text-lg mb-6"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#f0e0b8' }}
        >
          心念一动，万物皆知。<br />
          请默念所求之事，此卦便为你而启。
        </p>

        <div className="bg-[#f5ecd9]/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#8b7d5c]/30 p-5 sm:p-6 space-y-4">
          {/* 姓名 */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#3a2f1a' }}
            >
              你的姓名
            </label>
            <input
              type="text"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="请输入姓名"
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#8b7d5c]/40 bg-white text-[#3a2f1a] focus:outline-none focus:border-[#8b7d5c] focus:ring-2 focus:ring-[#8b7d5c]/30 text-base"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            />
          </div>

          {/* 问题 */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#3a2f1a' }}
            >
              你想问什么事？
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="例如：我该不该跳槽？"
              rows={4}
              className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-[#8b7d5c]/40 bg-white text-[#3a2f1a] focus:outline-none focus:border-[#8b7d5c] focus:ring-2 focus:ring-[#8b7d5c]/30 text-base resize-none"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            />
          </div>

          {/* 冷启动引导：3 个预设问题胶囊 */}
          <div>
            <p
              className="text-xs mb-2"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#8b7d5c' }}
            >
              —— 或选一题起念 ——
            </p>
            <div className="flex gap-2 flex-wrap">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setQuestion(q.text)}
                  className="px-4 py-2 rounded-full bg-[#8b7d5c]/15 hover:bg-[#8b7d5c]/30 border border-[#8b7d5c]/30 text-sm text-[#3a2f1a] transition-colors"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", minHeight: 36 }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border-l-4 border-red-500 px-3 py-2 rounded">
              {error}
            </p>
          )}

          {/* 起卦按钮 */}
          <button
            type="button"
            onClick={onStart}
            disabled={!realName.trim() || !question.trim()}
            className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-gradient-to-r from-[#8b7d5c] to-[#6a5d3a] text-[#f5ecd9] font-bold text-lg shadow-md hover:from-[#7a6c4c] hover:to-[#5a4d2a] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            🙏 为我起卦
          </button>
        </div>
      </div>
    </main>
  );
}

// =====================================================
//  子组件：animating 阶段（前摇 + 抛掷 + 落地悬停 + 淡出）
// =====================================================
function AnimatingPhase({
  coinResults,
  animStage,
}: {
  coinResults: string[];
  animStage: 'flash' | 'tossing' | 'hovering' | 'fading';
}) {
  return (
    <main className="relative z-10 flex-1 flex items-center justify-center px-4 overflow-hidden">
      {/* 阶段文案（中央底部） */}
      <div className="absolute bottom-24 left-0 right-0 text-center z-20">
        <p
          className="text-lg sm:text-xl"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#f5ecd9' }}
        >
          {animStage === 'flash' && '☯ 静心……'}
          {animStage === 'tossing' && '☯ 卦象正在生成…'}
          {animStage === 'hovering' && '☯ 铜钱落地，定数已成'}
          {animStage === 'fading' && '☯ 此卦为你而启…'}
        </p>
      </div>

      {/* 铜钱容器（hovering/fading 时光晕参考系） */}
      <div className="relative flex items-end justify-center" style={{ height: 280, width: 320 }}>
        {/* 落地后的光晕（hovering/fading 阶段显示） */}
        {(animStage === 'hovering' || animStage === 'fading') && (
          <>
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none animate-glow"
              style={{
                width: 220,
                height: 220,
                background: 'radial-gradient(circle, rgba(245, 215, 110, 0.7) 0%, rgba(245, 215, 110, 0) 70%)',
                filter: 'blur(20px)',
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none animate-glow"
              style={{
                width: 160,
                height: 160,
                background: 'radial-gradient(circle, rgba(255, 240, 180, 0.6) 0%, rgba(255, 240, 180, 0) 60%)',
                filter: 'blur(10px)',
                animationDelay: '0.4s',
              }}
            />
          </>
        )}

        {/* 三枚铜钱（外圆内方） */}
        <div
          className={`flex items-end justify-center gap-10 ${
            animStage === 'flash' ? 'opacity-0' : animStage === 'fading' ? 'animate-coin-fadeout' : 'animate-coin-appear'
          }`}
          style={{ perspective: 600, perspectiveOrigin: '50% 50%' }}
        >
          {[0, 1, 2].map((i) => {
            const faceChar = ['灵', '境', '乾'][i] || '通';
            return (
              <div
                key={i}
                className={`relative ${animStage === 'tossing' ? 'animate-coin' : animStage === 'hovering' || animStage === 'fading' ? 'animate-coin-rest' : ''}`}
                style={{
                  animationDelay: animStage === 'tossing' ? `${i * 0.15}s` : `${i * 0.1}s`,
                  width: 84,
                  height: 84,
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle at 35% 30%, #e8c66c 0%, #c89b2a 30%, #8B5A2B 60%, #5a3a1a 100%)',
                  boxShadow:
                    animStage === 'hovering' || animStage === 'fading'
                      ? '0 6px 36px rgba(245, 215, 110, 0.8), inset 0 -3px 10px rgba(0,0,0,0.35), inset 0 3px 8px rgba(255,255,255,0.5), inset 0 0 0 2px #6a4d0a, inset 0 0 0 4px rgba(0,0,0,0.15)'
                      : '0 4px 22px rgba(139, 90, 43, 0.5), inset 0 -3px 10px rgba(0,0,0,0.3), inset 0 3px 8px rgba(255,255,255,0.4), inset 0 0 0 2px #6a4d0a',
                  border: '1px solid #4a2a0a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* 方孔（内方） */}
                <div
                  className="coin-square-hole"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                    width: 18,
                    height: 18,
                    border: '3px solid #3a2410',
                    background:
                      'radial-gradient(circle at 30% 30%, rgba(0,0,0,0.85) 0%, rgba(40,25,10,0.95) 100%)',
                    boxShadow:
                      'inset 0 0 6px rgba(0,0,0,0.9), inset 0 1px 2px rgba(255,255,255,0.15), 0 1px 2px rgba(0,0,0,0.4)',
                  }}
                />
                {/* 正面字：极小 + 模糊（只在未落定时模糊） */}
                {animStage !== 'tossing' && (
                  <div
                    className="coin-face-char"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: 10,
                      color: '#2a1a08',
                      fontWeight: 900,
                      fontFamily: "'Ma Shan Zheng', cursive, serif",
                      filter: animStage === 'hovering' || animStage === 'fading' ? 'none' : 'blur(0.4px)',
                      opacity: animStage === 'hovering' || animStage === 'fading' ? 0.85 : 0.6,
                      pointerEvents: 'none',
                      zIndex: 2,
                      userSelect: 'none',
                    }}
                  >
                    {faceChar}
                  </div>
                )}
                {/* 落地后正反结果 */}
                {(animStage === 'hovering' || animStage === 'fading') && (
                  <div
                    className="coin-result"
                    style={{
                      position: 'absolute',
                      bottom: -28,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: 14,
                      color: '#f5ecd9',
                      fontFamily: "'Ma Shan Zheng', cursive, serif",
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      textShadow: '0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(245, 215, 110, 0.4)',
                      letterSpacing: 1,
                    }}
                  >
                    {coinResults[i]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 起卦前摇：黑暗/模糊遮罩（0.3s） */}
      {animStage === 'flash' && (
        <div
          className="absolute inset-0 z-30 animate-flash-in pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.95) 100%)',
          }}
          aria-hidden="true"
        />
      )}
    </main>
  );
}

// =====================================================
//  子组件：result 阶段（卦象 + 流式对话）
// =====================================================
function ResultPhase({
  hexagram,
  realName,
  question,
  messages,
  setMessages,
  chatInput,
  setChatInput,
  isTyping,
  error,
  onSend,
  messagesEndRef,
  remaining,
  isExempt,
  onUnlock,
  mounted,
}: {
  hexagram: typeof HEXAGRAM_LIST[number];
  realName: string;
  question: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chatInput: string;
  setChatInput: (v: string) => void;
  isTyping: boolean;
  error: string | null;
  onSend: (text: string) => void | Promise<void>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  remaining: number;
  isExempt: boolean;
  onUnlock: () => void;
  mounted: boolean;
}) {
  return (
    <>
      <main
        ref={messagesEndRef as any}
        className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-4"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {/* 卦象卡（仪式展示区）—— 只显示姓名 / 所问 / 卦象图 / 卦名 */}
          <div
            className="bg-[#f5ecd9]/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[#8b7d5c]/30 p-6 text-center animate-fade-in"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center items-center mb-4 text-sm" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              <div className="flex items-center gap-1.5">
                <span style={{ color: '#8b7d5c' }}>姓名：</span>
                <span style={{ color: '#3a2f1a' }}>{realName || '未填'}</span>
              </div>
              <div className="flex items-start gap-1.5 max-w-xs">
                <span style={{ color: '#8b7d5c' }}>所问：</span>
                <span style={{ color: '#3a2f1a' }} className="text-left break-words">{question}</span>
              </div>
            </div>
            <div
              className="text-7xl sm:text-8xl my-3"
              style={{ color: '#3a2f1a' }}
            >
              {hexagram.symbol}
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#3a2f1a' }}
            >
              {hexagram.name}
            </h2>
          </div>

          {/* 对话流 */}
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`relative max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-lg shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#8b7d5c] text-[#f5ecd9]'
                    : 'bg-[#f5ecd9]/95 text-[#3a2f1a]'
                }`}
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {msg.role === 'assistant' && !isTyping && idx === messages.length - 1 && msg.id !== 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      for (let i = idx - 1; i >= 0; i--) {
                        if (messages[i].role === 'user') {
                          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                          void onSend(messages[i].content);
                          return;
                        }
                      }
                    }}
                    title="重新生成"
                    aria-label="重新生成"
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#8b7d5c] hover:bg-[#6a5d3a] text-[#f5ecd9] text-xs leading-none flex items-center justify-center shadow-md transition-colors"
                  >
                    ↻
                  </button>
                )}
                <p className="whitespace-pre-wrap text-sm sm:text-base">{msg.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-lg shadow-sm bg-[#f5ecd9]/95 text-[#3a2f1a]">
                <div className="flex gap-1" aria-label="易理师正在推演">
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

      {/* 底部 sticky 输入框 */}
      <footer className="flex-shrink-0 sticky bottom-0 bg-[#8b7d5c]/90 backdrop-blur p-4 border-t border-[#f5ecd9]/30 relative z-10">
        <div className="max-w-3xl mx-auto">
          {mounted && !isExempt && remaining <= 0 ? (
            <div className="text-center py-3">
              <p
                className="text-sm mb-2"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#f5ecd9' }}
              >
                🪷 今日问卦次数已用完
              </p>
              <button
                type="button"
                onClick={onUnlock}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", minHeight: 48 }}
              >
                🌟 解锁继续问卦
              </button>
            </div>
          ) : (
            <>
              {/* 追问胶囊快捷栏：仅在初始聊天（无 user 消息）时显示 */}
              {messages.filter((m) => m.role === 'user').length === 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {[
                    { label: '💰 这卦财运如何？', value: '这卦财运如何？' },
                    { label: '⚠️ 有什么要注意的？', value: '有什么要注意的？' },
                    { label: '⏳ 应期大概多久？', value: '应期大概多久？' },
                  ].map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => {
                        if (!isTyping) void onSend(c.value);
                      }}
                      disabled={isTyping}
                      className="px-3 py-1.5 rounded-full bg-[#f5ecd9]/15 text-[#f5ecd9] text-xs hover:bg-[#f5ecd9]/30 disabled:opacity-40 transition-colors border border-[#f5ecd9]/30"
                      style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (chatInput.trim() && !isTyping) {
                        void onSend(chatInput);
                      }
                    }
                  }}
                  placeholder="向易理师追问…"
                  className="flex-1 min-h-[48px] px-3 py-2 rounded-xl bg-white text-[#3a2f1a] focus:outline-none focus:ring-2 focus:ring-[#f5ecd9] text-base"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                />
                <button
                  type="button"
                  onClick={() => chatInput.trim() && !isTyping && onSend(chatInput)}
                  disabled={isTyping || !chatInput.trim()}
                  className="min-h-[48px] px-5 rounded-xl bg-[#3a2f1a] text-[#f5ecd9] font-bold disabled:opacity-40"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                >
                  问
                </button>
              </div>
            </>
          )}
        </div>
      </footer>
    </>
  );
}
