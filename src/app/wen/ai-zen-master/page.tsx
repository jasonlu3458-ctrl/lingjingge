'use client';

import { useState, useRef, FormEvent, useEffect, useCallback } from 'react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export default function AiZenMaster() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: '阿弥陀佛，施主好。我是 AI 禅师，有什么困惑我可以帮你解答吗？',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 新增：字符队列和定时器 ref
  const charQueueRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 新增：输入框 ref，用于自动聚焦
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedConversationId = localStorage.getItem('conv_ai_zen_uuid');
    setConversationId(savedConversationId);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 新增：逐字显示辅助函数
  const flushChars = useCallback((assistantMessageId: number) => {
    // 如果定时器已经存在，不重复启动
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      // 如果队列为空且流式结束，清除定时器
      if (charQueueRef.current.length === 0 && !isTyping) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      // 从队列中取一个字符
      const char = charQueueRef.current.shift();
      if (char !== undefined) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + char }
              : msg
          )
        );
        scrollToBottom();
      }
    }, 50); // 50毫秒一字
  }, [isTyping]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    // 新增：清除定时器并清空队列
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    charQueueRef.current = [];

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setError(null);

    const assistantMessageId = Date.now() + 1;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app: 'ai-zen-master',
          type: 'chat',
          query: userMessage.content,
          conversation_id: conversationId || '',
          inputs: {},
          user: 'lingjingge-user',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `请求失败: ${response.status}`);
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
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                // 优先更新 conversation_id
                if (data.conversation_id) {
                  setConversationId(data.conversation_id);
                  localStorage.setItem('conv_ai_zen_uuid', data.conversation_id);
                }
                
                if (data.event === 'message' && data.answer) {
                  data.answer.split('').forEach((char: string) => charQueueRef.current.push(char));
                  flushChars(assistantMessageId);
                }
                
                if (data.event === 'agent_message' && data.answer) {
                  data.answer.split('').forEach((char: string) => charQueueRef.current.push(char));
                  flushChars(assistantMessageId);
                }
                
                if (data.event === 'message_end') {
                  // 不立即设置，等待队列清空
                  setIsTyping(false);
                }
              } catch (parseError) {
                console.error('解析流数据失败:', parseError);
              }
            }
          }
        }
      }

      // 等待队列清空后再结束
      const waitForQueue = () => {
        return new Promise<void>((resolve) => {
          const checkQueue = setInterval(() => {
            if (charQueueRef.current.length === 0) {
              clearInterval(checkQueue);
              resolve();
            }
          }, 30);
        });
      };
      
      await waitForQueue();

      // 流结束后延迟 100ms 自动聚焦到输入框
      // 延迟是为了确保 disabled 属性已被移除
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      // 不再检查状态，因为定时器已经确保内容被正确显示
      // 如果没有收到内容，定时器会在队列为空且 isTyping 为 false 时停止

    } catch (err) {
      // 清除定时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      charQueueRef.current = [];
      
      setIsTyping(false);
      const errorMessage = err instanceof Error ? err.message : '发送消息失败，请稍后重试';
      setError(errorMessage);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: '抱歉，发生了错误。请稍后重试。' }
            : msg
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-zen-beige">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zen-ink mb-2">AI 禅师</h1>
          <p className="text-gray-600">与 AI 禅师对话，解开心灵困惑</p>
        </div>

        <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray overflow-hidden">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-zen-ink text-white'
                      : 'bg-zen-gray text-zen-ink'
                  }`}
                >
                  <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-zen-gray px-4 py-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-zen-gray p-4">
            <div className="flex space-x-4">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="请输入您的困惑..."
                disabled={isTyping}
                className="flex-1 px-4 py-2 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink bg-white bg-opacity-60 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className="px-6 py-2 bg-zen-ink text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isTyping ? '发送中...' : '发送'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
