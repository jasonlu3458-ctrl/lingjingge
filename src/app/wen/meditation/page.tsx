'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export default function MeditationPage() {
  const [formData, setFormData] = useState({
    scene: 'sleep',
    duration: 5
  });
  const [guideText, setGuideText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 对话相关状态
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  
  // 流式对话相关 ref
  const charQueueRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化对话 ID
  useEffect(() => {
    const savedConversationId = localStorage.getItem('conv_meditation_uuid');
    if (savedConversationId) {
      setConversationId(savedConversationId);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 逐字显示辅助函数
  const flushChars = useCallback((assistantMessageId: number) => {
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      if (charQueueRef.current.length === 0 && !isSubmittingFollowUp) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

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
    }, 50);
  }, [isSubmittingFollowUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meditation',
          query: `场景：${formData.scene === 'sleep' ? '助眠' : formData.scene === 'stress' ? '减压' : '专注'}，时长：${formData.duration}分钟`,
          inputs: {
            scene: formData.scene,
            duration: formData.duration
          },
          user: 'lingjingge-user',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResult = '';

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
                
                if (data.conversation_id) {
                  setConversationId(data.conversation_id);
                  localStorage.setItem('conv_meditation_uuid', data.conversation_id);
                }
                
                if ((data.event === 'message' || data.event === 'agent_message') && data.answer) {
                  fullResult += data.answer;
                }
              } catch (parseError) {
                console.error('解析流数据失败:', parseError);
              }
            }
          }
        }
      }

      const text = fullResult || '请放松身心，跟随呼吸的节奏...';
      setGuideText(text);
    } catch (error) {
      console.error('AI 生成失败:', error);
      setGuideText('AI 生成暂时不可用，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuestion.trim() || isSubmittingFollowUp) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    charQueueRef.current = [];

    setIsSubmittingFollowUp(true);
    setError(null);

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: followUpQuestion,
    };

    setMessages((prev) => [...prev, userMessage]);
    setFollowUpQuestion('');

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
          type: 'meditation',
          query: followUpQuestion,
          conversation_id: conversationId || '',
          inputs: {},
          user: 'lingjingge-user',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `请求失败：${response.status}`);
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
                
                if (data.conversation_id) {
                  setConversationId(data.conversation_id);
                  localStorage.setItem('conv_meditation_uuid', data.conversation_id);
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
                  setIsSubmittingFollowUp(false);
                }
              } catch (parseError) {
                console.error('解析流数据失败:', parseError);
              }
            }
          }
        }
      }

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

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

    } catch (err) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      charQueueRef.current = [];
      
      setIsSubmittingFollowUp(false);
      setError(err instanceof Error ? err.message : '追问失败，请稍后重试');

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: '抱歉，发生了错误。请稍后重试。' }
            : msg
        )
      );
    }
  };

  const resetForm = () => {
    setFormData({ scene: 'sleep', duration: 5 });
    setGuideText(null);
    setError(null);
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-zen-beige">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zen-ink mb-2">正念冥想</h1>
          <p className="text-gray-600">选择场景与时长，获取专属引导</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-zen-ink mb-3">选择场景</label>
              <select
                value={formData.scene}
                onChange={(e) => setFormData({ ...formData, scene: e.target.value })}
                className="w-full px-4 py-3 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink bg-white bg-opacity-60"
              >
                <option value="sleep">助眠</option>
                <option value="stress">减压</option>
                <option value="focus">专注</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-zen-ink mb-3">时长（分钟）</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink bg-white bg-opacity-60"
              >
                <option value={5}>5 分钟</option>
                <option value={10}>10 分钟</option>
                <option value={15}>15 分钟</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-zen-ink text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'AI 生成中...' : '开始冥想'}
            </button>
          </form>

          {guideText && (
            <div className="mt-8 p-6 bg-zen-gray rounded-lg">
              <pre className="text-zen-ink text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                {guideText}
              </pre>
              <button
                onClick={resetForm}
                className="mt-4 w-full px-6 py-2 border border-zen-ink text-zen-ink rounded-lg hover:bg-zen-gray transition-colors"
              >
                重新生成
              </button>
            </div>
          )}
        </div>

        {/* 对话历史 */}
        {messages.length > 0 && (
          <div className="mt-6 bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8">
            <h3 className="text-xl font-semibold text-zen-ink mb-4">对话历史</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-zen-ink text-white'
                        : 'bg-zen-gray text-zen-ink'
                    }`}
                  >
                    <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isSubmittingFollowUp && (
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
          </div>
        )}

        {/* 追问输入框 */}
        <div className="mt-6 bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8">
          <h3 className="text-xl font-semibold text-zen-ink mb-4">继续追问</h3>
          <form onSubmit={handleFollowUpSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={followUpQuestion}
              onChange={(e) => setFollowUpQuestion(e.target.value)}
              placeholder="输入您想进一步了解的问题..."
              disabled={isSubmittingFollowUp}
              className="flex-1 px-4 py-3 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink bg-white bg-opacity-60"
            />
            <button
              type="submit"
              disabled={isSubmittingFollowUp || !followUpQuestion.trim()}
              className="px-6 py-3 bg-zen-ink text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isSubmittingFollowUp ? '发送中...' : '发送'}
            </button>
          </form>
        </div>

        <Link href="/home" className="inline-block mt-6 text-gray-600 hover:text-zen-ink transition-colors">
          ← 返回首页
        </Link>
      </main>
    </div>
  );
}