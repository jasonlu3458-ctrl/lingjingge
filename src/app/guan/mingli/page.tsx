'use client';

import { useState, FormEvent, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export default function MingliPage() {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthdate: '',
    birthtime: '',
  });
  const [result, setResult] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  // 新增：字符队列和定时器 ref
  const charQueueRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 新增：输入框 ref，用于自动聚焦
  const inputRef = useRef<HTMLInputElement>(null);
  // 新增：消息末尾 ref，用于自动滚动
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化对话 ID
  useEffect(() => {
    const savedConversationId = localStorage.getItem('conv_mingli_uuid');
    if (savedConversationId) {
      setConversationId(savedConversationId);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 新增：逐字显示辅助函数
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'mingli',
          query: `姓名：${formData.name}，性别：${formData.gender}，生日：${formData.birthdate}${formData.birthtime ? '，时辰：' + formData.birthtime : ''}`,
          inputs: {
            name: formData.name,
            gender: formData.gender,
            birthdate: formData.birthdate,
            birthtime: formData.birthtime,
          },
          user: 'lingjingge-user',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `请求失败：${response.status}`);
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
                  localStorage.setItem('conv_mingli_uuid', data.conversation_id);
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

      const resultContent = fullResult || '分析完成，请查看详细报告';
      setResult(typeof resultContent === 'string' ? resultContent : JSON.stringify(resultContent));
      setShowResult(true);

      const userMessage: Message = {
        id: Date.now(),
        role: 'user',
        content: `姓名：${formData.name}，性别：${formData.gender}，生日：${formData.birthdate}`,
      };
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: resultContent,
      };
      setMessages([userMessage, assistantMessage]);
    } catch (err) {
      console.error('错误信息:', err);
      setError(err instanceof Error ? err.message : '分析失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!followUpQuestion.trim() || isSubmittingFollowUp) return;

    // 清除定时器并清空队列
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
          type: 'mingli',
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
                  localStorage.setItem('conv_mingli_uuid', data.conversation_id);
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

      // 等待队列清空
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

      // 流结束后自动聚焦输入框
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
      const errorMessage = err instanceof Error ? err.message : '追问失败，请稍后重试';
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

  const handleFeedback = async (type: 'useful' | 'useless') => {
    if (feedbackSubmitted) return;

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: 'mingli',
          type,
          conversation_id: conversationId || '',
        }),
      });
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error('提交反馈失败:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      gender: '',
      birthdate: '',
      birthtime: '',
    });
    setShowResult(false);
    setResult('');
    setError(null);
    setMessages([]);
    setFeedbackSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-zen-beige">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zen-ink mb-2">AI 生命密码</h1>
          <p className="text-gray-600">探索生命奥秘，解读人生密码</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!showResult ? (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8">
              <h2 className="text-xl font-semibold text-zen-ink mb-6">基本信息</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-zen-ink mb-2">姓名</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="请输入姓名"
                    className="w-full px-4 py-3 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink bg-white bg-opacity-60"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zen-ink mb-2">性别</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="男"
                        checked={formData.gender === '男'}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="mr-2"
                        required
                      />
                      <span className="text-zen-ink">男</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="女"
                        checked={formData.gender === '女'}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="mr-2"
                        required
                      />
                      <span className="text-zen-ink">女</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-zen-ink mb-2">出生日期</label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => handleInputChange('birthdate', e.target.value)}
                    className="w-full px-4 py-3 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink bg-white bg-opacity-60"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zen-ink mb-2">出生时辰（可选）</label>
                  <select
                    value={formData.birthtime}
                    onChange={(e) => handleInputChange('birthtime', e.target.value)}
                    className="w-full px-4 py-3 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink bg-white bg-opacity-60"
                  >
                    <option value="">请选择</option>
                    <option value="子时">子时 (23:00-01:00)</option>
                    <option value="丑时">丑时 (01:00-03:00)</option>
                    <option value="寅时">寅时 (03:00-05:00)</option>
                    <option value="卯时">卯时 (05:00-07:00)</option>
                    <option value="辰时">辰时 (07:00-09:00)</option>
                    <option value="巳时">巳时 (09:00-11:00)</option>
                    <option value="午时">午时 (11:00-13:00)</option>
                    <option value="未时">未时 (13:00-15:00)</option>
                    <option value="申时">申时 (15:00-17:00)</option>
                    <option value="酉时">酉时 (17:00-19:00)</option>
                    <option value="戌时">戌时 (19:00-21:00)</option>
                    <option value="亥时">亥时 (21:00-23:00)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !formData.name || !formData.gender || !formData.birthdate}
                  className="w-full px-6 py-3 bg-zen-ink text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '分析中...' : '开始分析'}
                </button>
              </form>
            </div>

            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8">
              <h2 className="text-xl font-semibold text-zen-ink mb-6">关于生命密码</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  生命密码是一种结合中西方智慧的生命解析方法，通过数字和符号揭示个人的天赋潜能和人生轨迹。
                </p>
                <p>
                  输入您的基本信息，AI 将为您进行全面的生命密码解析，帮助您更好地认识自己、把握人生方向。
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 分析结果 */}
            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-zen-ink mb-4">分析完成</h2>
                <p className="text-gray-600">以下是您的生命密码分析报告</p>
              </div>

              <div className="bg-zen-gray rounded-lg p-6 whitespace-pre-wrap text-gray-700 mb-6">
                {result}
              </div>

              {/* 反馈按钮 */}
              <div className="flex justify-center gap-4 mb-6">
                <p className="text-gray-600 mr-4">这份报告对您有帮助吗？</p>
                <button
                  onClick={() => handleFeedback('useful')}
                  disabled={feedbackSubmitted}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    feedbackSubmitted
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  👍 有帮助
                </button>
                <button
                  onClick={() => handleFeedback('useless')}
                  disabled={feedbackSubmitted}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    feedbackSubmitted
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  👎 没帮助
                </button>
              </div>

              <button
                onClick={resetForm}
                className="w-full px-6 py-3 bg-zen-ink text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                重新分析
              </button>
            </div>

            {/* 对话历史 */}
            {messages.length > 0 && (
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8">
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
            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8">
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

            {/* 主动推荐 */}
            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8">
              <h3 className="text-xl font-semibold text-zen-ink mb-4">相关推荐</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="/guan/name"
                  className="p-4 bg-zen-gray rounded-lg hover:bg-gray-200 transition-colors block"
                >
                  <h4 className="font-semibold text-zen-ink mb-2">🏷️ AI 取名轩</h4>
                  <p className="text-sm text-gray-600">
                    根据您的生命密码，为宝宝取一个吉祥如意的好名字
                  </p>
                </a>
                <a
                  href="/yili"
                  className="p-4 bg-zen-gray rounded-lg hover:bg-gray-200 transition-colors block"
                >
                  <h4 className="font-semibold text-zen-ink mb-2">☯️ AI 易理师</h4>
                  <p className="text-sm text-gray-600">
                    易经占卜，为您的人生决策提供智慧指引
                  </p>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}