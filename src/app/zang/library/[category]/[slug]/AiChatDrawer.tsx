// ============================================================
// AiChatDrawer —— 段落参详 ChatUI 抽屉
// 调 /api/zang/ai-assistant（Dify 藏经 AI 助教）
// 支持流式累加 + 引导语显示当前段落出处
// ============================================================

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { consumeDifySSE } from '@/lib/sse-client';

export interface AiChatDrawerProps {
  open: boolean;
  onClose: () => void;
  /** 触发本段参详的原文（已自动拼入 prompt） */
  passage: string;
  /** 触发处上下文：篇章标题，便于 prompt 引导 */
  articleTitle: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChatDrawer({ open, onClose, passage, articleTitle }: AiChatDrawerProps): ReactNode {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [streaming, setStreaming] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastPassageRef = useRef<string>('');

  // 抽屉打开时：注入首条 user 消息（段落原文 + 引导）
  useEffect(() => {
    if (!open) return;
    if (passage && passage !== lastPassageRef.current) {
      lastPassageRef.current = passage;
      setMessages([
        {
          role: 'user',
          content: `【${articleTitle}】\n${passage}\n\n请结合现代生活，给出 1-2 个可感知的解读。`,
        },
      ]);
      setErrorMsg('');
      // 自动发起首轮问询
      void runTurn(
        `【${articleTitle}】\n${passage}\n\n请结合现代生活，给出 1-2 个可感知的解读。`,
        '',
      );
    }
  }, [open, passage, articleTitle]);

  // 自动滚到底
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streaming]);

  async function runTurn(userPrompt: string, prior: string): Promise<void> {
    setStreaming(true);
    setErrorMsg('');
    // 先在末尾追加 assistant 占位
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/zang/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: articleTitle,
          passage: passage,
          prompt: userPrompt,
          prior: prior,
        }),
      });

      if (!res.ok) {
        setErrorMsg(`请求失败 ${res.status}`);
        setStreaming(false);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && res.body) {
        await consumeDifySSE(res, {
          onDelta: (acc) => {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: 'assistant', content: acc };
              return next;
            });
          },
          onEnd: () => setStreaming(false),
          onError: (e) => {
            setErrorMsg(e);
            setStreaming(false);
          },
        });
      } else {
        const json = await res.json();
        if (json.success) {
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: json.content || '' };
            return next;
          });
        } else {
          setErrorMsg(json.error || '生成失败');
        }
        setStreaming(false);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '网络错误');
      setStreaming(false);
    }
  }

  async function handleSend(): Promise<void> {
    const text = input.trim();
    if (!text || streaming) return;
    const prior = messages
      .filter((m) => m.role === 'assistant')
      .map((m) => m.content)
      .join('\n');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    await runTurn(text, prior);
  }

  if (!open) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden
      />
      {/* 抽屉 */}
      <aside
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-white z-50 shadow-2xl flex flex-col"
        role="dialog"
        aria-label="AI 参详"
      >
        {/* 头部 */}
        <header className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#2c2c2c] flex items-center gap-2">
              <span>🧠</span>
              <span>AI 藏经助教</span>
            </h3>
            <p className="mt-1 text-[10px] text-gray-500">当前参详：{articleTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg w-8 h-8 rounded-full hover:bg-gray-100 transition"
            aria-label="关闭"
          >
            ✕
          </button>
        </header>

        {/* 段落引文（顶部 sticky） */}
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200">
          <p className="text-[10px] text-amber-700 tracking-widest mb-1">📜 参详原文</p>
          <p className="text-xs text-amber-900 leading-relaxed line-clamp-4 italic">
            {passage}
          </p>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#b88a4a] text-white'
                    : 'bg-gray-100 text-[#2c2c2c]'
                }`}
              >
                {m.content || (m.role === 'assistant' && streaming ? '…' : '')}
              </div>
            </div>
          ))}
          {errorMsg && (
            <div className="text-xs text-amber-600 px-2">⚠️ {errorMsg}</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区 */}
        <div className="border-t border-gray-200 p-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={streaming ? 'AI 智能顾问正在书写…' : '追问此段，或谈谈你的理解…'}
            disabled={streaming}
            className="flex-1 text-sm px-3 py-2 rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-[#b88a4a] focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={streaming || !input.trim()}
            className="px-4 py-2 rounded-full bg-[#b88a4a] text-white text-sm font-medium active:scale-95 active:opacity-80 transition-all duration-150 disabled:opacity-50 hover:bg-[#a07a3e]"
          >
            发送
          </button>
        </div>
      </aside>
    </>
  );
}
