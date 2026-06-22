'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import InkSpreadAnimation from './InkSpreadAnimation';
import ConsentModal from './ConsentModal';
import ReportPaywall from './ReportPaywall';
import { useFreeTurns } from '@/hooks/useFreeTurns';
import { useConsent } from '@/hooks/useConsent';
import { useTTS } from '@/hooks/useTTS';
import type { UserRole } from '@/lib/auth';
import ZenAvatar from './ZenAvatar';
import MiniMarkdown from './MiniMarkdown';

export interface StateOption {
  label: string;
  value: string;
  recommendation: string;
  duration: number;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date';
  placeholder?: string;
  required: boolean;
  options?: { label: string; value: string }[];
}

export interface PageConfig {
  title: string;
  subtitle: string;
  icon: string;
  theme: string;
  welcomeMessage: string;
  difyType: string;
  /**
   * 是否在开屏强制弹出免责声明
   * - true（默认）：首次访问弹窗（命理/报告/付费类关键页面）
   * - false：不弹（藏经阁原文、术语百科、法脉源流等"非关键"页面）
   */
  requireConsent?: boolean;
  formConfig?: {
    submitLabel: string;
    fields: FormField[];
    reportStructure?: {
      free: string[];
      premium: string[];
    };
  };
  meditationConfig?: {
    stateOptions: StateOption[];
    promptTemplate: string;
  };
  conversationConfig?: {
    roundsForReport: number;
    promptStart: string;
    reportStructure?: {
      free: string[];
      premium: string[];
    };
  };
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatUIProps {
  config: PageConfig;
  userRole?: 'free' | 'member' | 'admin';
}

export default function ChatUI({ config, userRole = 'free' }: ChatUIProps) {
  const { used, limit, remaining, isExempt, canSend, trySend, mounted } = useFreeTurns(config.difyType, userRole);
  // 同意弹窗：未同意时开屏显示，同意后写 localStorage 不再弹
  // - requireConsent !== false 才弹（默认 true），藏经阁原文等非关键页面跳过
  const { hasConsented, giveConsent, hydrated } = useConsent();
  const { speak, stop, isSpeaking, isLoading: isTTSLoading, error: ttsError } = useTTS();
  const [showConsent, setShowConsent] = useState(false);
  useEffect(() => {
    if (hydrated && config.requireConsent !== false && !hasConsented) {
      setShowConsent(true);
    }
  }, [hydrated, hasConsented, config.requireConsent]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [chatInput, setChatInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [selectedState, setSelectedState] = useState<StateOption | null>(null);
  const [guideText, setGuideText] = useState<string | null>(null);

  // 公案模式特殊状态
  const [gonganCount, setGonganCount] = useState(0);
  const [currentGongan, setCurrentGongan] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const charQueueRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 同意弹窗处理：写入 localStorage + 后端（用于法律证据） + 关闭弹窗
  const handleConsentConfirm = useCallback(() => {
    giveConsent();
    setShowConsent(false);
    // 异步上报到服务端（失败不影响前端）
    fetch('/api/user/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: 'v1.0' }),
    }).catch(() => {});
  }, [giveConsent]);
  const handleConsentCancel = useCallback(() => {
    setShowConsent(false);
  }, []);

  useEffect(() => {
    const savedConversationId = localStorage.getItem(`conv_${config.difyType}_uuid`);
    if (savedConversationId) {
      setConversationId(savedConversationId);
    }
    
    // 公案模式：首次加载时随机选一则公案
    if (config.difyType === 'gongan') {
      const gongans = [
        '如何是祖师西来意？',
        '什么是佛？',
        '什么是禅？',
        '如何是本来面目？',
        '万法归一，一归何处？',
        '狗子还有佛性也无？',
        '如何是无位真人？',
        '竹影扫阶尘不动，月穿潭底水无痕。如何会？'
      ];
      setCurrentGongan(gongans[Math.floor(Math.random() * gongans.length)]);
      // 从 localStorage 读取参悟次数
      const savedCount = localStorage.getItem('gongan_count');
      if (savedCount) {
        setGonganCount(parseInt(savedCount, 10));
      }
    }
  }, [config.difyType]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const flushChars = useCallback((assistantMessageId: number) => {
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      if (charQueueRef.current.length === 0 && !isTyping) {
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
  }, [isTyping]);

  const handleSend = async (query: string, inputs: Record<string, any> = {}) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    charQueueRef.current = [];

    // 免费轮次守卫（mounted 之前不阻塞）
    if (mounted) {
      const allowed = trySend();
      if (!allowed) return; // 已跳转到 /tong/signup
    }

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    const assistantMessageId = Date.now() + 1;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // 公案模式：AI只回复"是"或"不是"
    if (config.difyType === 'gongan') {
      // 延迟模拟思考过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 随机回复"是"或"不是"
      const responses = ['是', '不是'];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // 更新参悟次数
      const newCount = gonganCount + 1;
      setGonganCount(newCount);
      localStorage.setItem('gongan_count', newCount.toString());
      
      // 更新消息内容
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: randomResponse }
            : msg
        )
      );
      
      setIsTyping(false);
      return;
    }

    if (config.difyType === 'awakening') {
      try {
        const response = await fetch('/api/dify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: config.difyType,
            query: query,
            conversation_id: '',
            inputs: {},
            user: 'lingjingge-user',
          }),
        });

        if (!response.ok) {
          throw new Error('请求失败');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

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
                  if ((data.event === 'message' || data.event === 'agent_message') && data.answer) {
                    fullResponse += data.answer;
                  }
                } catch {
                  /* 单条流数据异常不影响后续 */
                }
              }
            }
          }
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: '🌌 回响：\n\n' + fullResponse }
              : msg
          )
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '请求失败，请稍后重试';
        setError(errorMessage);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: '🌌 回响：\n\n' + '抱歉，此刻心灵的回响微弱，请稍后再试。' }
              : msg
          )
        );
      }

      setIsTyping(false);
      return;
    }

    if (config.difyType === 'healing') {
      try {
        const scenePrompts: Record<string, string> = {
          anxiety: '同修感到焦虑不安，请给出详细的放松疗愈方案，包括呼吸练习、冥想方法和日常建议。',
          fatigue: '同修身心疲惫，需要能量补充，请提供恢复精力的疗愈方案，包括休息建议、能量补充方法。',
          sadness: '同修情绪低落，需要情绪疗愈，请提供温暖的安慰和情绪调节方法。',
          stress: '同修压力很大，请提供减压方案，包括放松技巧、时间管理建议。',
          confusion: '同修感到迷茫困惑，请提供引导性的思考问题和行动建议。',
          loneliness: '同修感到孤独寂寞，请提供自我关怀和建立连接的建议。',
        };

        const prompt = scenePrompts[query] || `同修状态：${query}，请给出相应的疗愈建议。`;

        const response = await fetch('/api/dify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: config.difyType,
            query: prompt,
            conversation_id: '',
            inputs: {},
            user: 'lingjingge-user',
          }),
        });

        if (!response.ok) {
          throw new Error('请求失败');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

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
                  if ((data.event === 'message' || data.event === 'agent_message') && data.answer) {
                    fullResponse += data.answer;
                  }
                } catch {
                  /* 单条流数据异常不影响后续 */
                }
              }
            }
          }
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: '💚 疗愈处方：\n\n' + fullResponse }
              : msg
          )
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '请求失败，请稍后重试';
        setError(errorMessage);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: '💚 疗愈处方：\n\n' + '抱歉，疗愈能量正在恢复中，请稍后再试。' }
              : msg
          )
        );
      }

      setIsTyping(false);
      return;
    }

    try {
      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: config.difyType,
          query: query,
          conversation_id: conversationId || '',
          inputs: inputs,
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
                
                if (data.conversation_id) {
                  setConversationId(data.conversation_id);
                  localStorage.setItem(`conv_${config.difyType}_uuid`, data.conversation_id);
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
                  setIsTyping(false);
                }
              } catch {
                /* 单条流数据异常不影响后续 */
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

    } catch (err) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      charQueueRef.current = [];
      
      setIsTyping(false);
      const errorMessage = err instanceof Error ? err.message : '请求失败，请稍后重试';
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证必填字段
    if (config.formConfig?.fields) {
      const requiredFields = config.formConfig.fields.filter(f => f.required);
      const missingFields = requiredFields.filter(f => !formData[f.name]);
      
      if (missingFields.length > 0) {
        setError('请填写所有必填项');
        return;
      }
    }

    setShowForm(false);
    
    // 构造查询内容
    let query = '';
    if (config.formConfig?.fields) {
      config.formConfig.fields.forEach(field => {
        if (formData[field.name]) {
          if (field.type === 'select' && field.options) {
            const optionLabel = field.options.find(o => o.value === formData[field.name])?.label || formData[field.name];
            query += `${field.label}：${optionLabel}\n`;
          } else {
            query += `${field.label}：${formData[field.name]}\n`;
          }
        }
      });
    }

    handleSend(query, formData);
  };

  const handleStateSelect = async (option: StateOption) => {
    setSelectedState(option);
    
    const prompt = config.meditationConfig?.promptTemplate?.replace('{state}', option.label) || 
      `用户状态：${option.label}。请推荐适合的修法并生成引导词。`;
    
    try {
      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: config.difyType,
          query: prompt,
          inputs: {
            state: option.value,
            recommendation: option.recommendation,
            duration: option.duration,
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
                  localStorage.setItem(`conv_${config.difyType}_uuid`, data.conversation_id);
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

      setGuideText(fullResult || '请放松身心，跟随呼吸的节奏...');
    } catch (error) {
      console.error('AI 生成失败:', error);
      setGuideText('AI 生成暂时不可用，请稍后重试。');
    }
  };

  const handleNewConsultation = () => {
    setMessages([]);
    setFormData({});
    setChatInput('');
    setShowForm(true);
    setError(null);
    setSelectedState(null);
    setGuideText(null);
    setConversationId(null);
  };

  // 纯对话模式的提交处理
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setShowForm(false);

    await handleSend(userMessage, {});
  };

  // 如果有 meditationConfig，渲染状态选择界面
  if (config.meditationConfig && !guideText) {
    return (
      <>
        {showConsent && (
          <ConsentModal
            onConfirm={handleConsentConfirm}
            onCancel={handleConsentCancel}
          />
        )}
        <div className="flex flex-col h-screen" style={{ backgroundColor: config.theme }}>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="mb-6 flex justify-center">
              <ZenAvatar size={80} opacity={0.25} />
            </div>
            <h2 className="text-3xl font-serif mb-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              {config.title}
            </h2>
            <p className="text-gray-600 mb-8" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              {config.welcomeMessage}
            </p>
            <div className="space-y-4">
              {config.meditationConfig.stateOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStateSelect(option)}
                  className="w-full py-4 px-6 bg-white/80 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                >
                  <div className="text-lg">{option.label}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    推荐修法：{option.recommendation} · {option.duration}分钟
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  // 冥想模式下显示引导词
  if (config.meditationConfig && guideText) {
    return (
      <>
        {showConsent && (
          <ConsentModal
            onConfirm={handleConsentConfirm}
            onCancel={handleConsentCancel}
          />
        )}
        <div className="flex flex-col h-screen" style={{ backgroundColor: config.theme }}>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center max-w-2xl w-full">
            <div className="mb-4 flex justify-center">
              <ZenAvatar size={56} opacity={0.22} />
            </div>
            <h2 className="text-2xl font-serif mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              {config.title}
            </h2>
            <p className="text-gray-600 mb-6" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              当前状态：{selectedState?.label}
            </p>
            <div className="bg-white/90 rounded-xl p-8 shadow-lg">
              <pre className="text-gray-800 text-base whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                {guideText}
              </pre>
            </div>
            <button
              onClick={handleNewConsultation}
              className="mt-6 px-8 py-3 bg-white/80 text-gray-800 rounded-xl hover:bg-white transition-colors"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            >
              返回选择状态
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  // 判断是否为纯对话模式（无表单配置）
  const isPureChatMode = !config.formConfig && !config.meditationConfig;

  // 普通表单模式或纯对话模式
  return (
    <>
      {showConsent && (
        <ConsentModal
          onConfirm={handleConsentConfirm}
          onCancel={handleConsentCancel}
        />
      )}
      <div className="flex flex-col" style={{ backgroundColor: config.theme }}>
        <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 pb-32 md:pb-32 pb-safe-or-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="mb-2 flex justify-center">
            <ZenAvatar size={48} opacity={0.22} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            {config.title}
          </h1>
          <p className="text-gray-600" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            {config.subtitle}
          </p>
        </div>

        {/* 欢迎消息 */}
        <div className="bg-white bg-opacity-80 rounded-lg p-6 mb-6 text-center">
          <p className="text-lg text-gray-700" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            {config.welcomeMessage}
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 表单区域 - 仅在有 formConfig 时显示 */}
        {showForm && config.formConfig && (
          <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {config.formConfig.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'select' && (
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      required={field.required}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white"
                      style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                    >
                      <option value="">请选择...</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                      style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                    />
                  )}
                  
                  {field.type === 'textarea' && (
                    <textarea
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 resize-none"
                      style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                    />
                  )}
                  
                  {field.type === 'date' && (
                    <input
                      type="date"
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      required={field.required}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                    />
                  )}
                </div>
              ))}
              
              <button
                type="submit"
                disabled={isTyping}
                className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}
              >
                {isTyping ? '正在生成...' : config.formConfig.submitLabel}
              </button>
            </form>
          </div>
        )}

        {/* 免费轮次提示 - 仅未登录/免费用户，剩 ≤2 轮时显示 */}
        {mounted && !isExempt && remaining <= 2 && remaining >= 0 && (
          <div className={`mb-3 px-4 py-2 rounded-lg text-center text-sm ${
            remaining === 0
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`} style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            {remaining === 0
              ? `本工具免费体验已用完（${used}/${limit}）· 注册后可继续对话 →`
              : `免费体验还剩 ${remaining} 次（${used}/${limit}）`}
            {remaining === 0 && (
              <Link
                href={`/tong/signup?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`}
                className="ml-2 underline font-medium"
              >
                立即注册
              </Link>
            )}
          </div>
        )}

        {/* 纯对话模式的输入区域 */}
        {isPureChatMode && showForm && config.difyType !== 'awakening' && config.difyType !== 'healing' && (
          <form onSubmit={handleChatSubmit} className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md rounded-lg shadow-[0_-4px_16px_rgba(0,0,0,0.08)] border border-gray-200 p-4 mb-4 pb-safe">
            <div className="flex space-x-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="请输入您的问题..."
                disabled={isTyping}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white disabled:bg-gray-100"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              />
              <button
                type="submit"
                disabled={isTyping || !chatInput.trim()}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {isTyping ? '发送中...' : '发送'}
              </button>
            </div>
          </form>
        )}

        {/* AI 疗愈师 · 场景选择卡片 */}
        {isPureChatMode && showForm && config.difyType === 'healing' && messages.length === 0 && (
          <div className="bg-gradient-to-br from-emerald-900/80 to-teal-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-500/30 p-8 mb-6">
            <div className="text-center mb-8">
              <div className="mb-4 flex justify-center">
                <ZenAvatar size={48} opacity={0.3} style={{ color: '#d1fae5' }} />
              </div>
              <h3 className="text-xl text-emerald-100" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}>
                AI 疗愈师 · 智能分析
              </h3>
              <p className="text-emerald-200/70 text-sm mt-2">
                选择您当前的状态，获取专属疗愈处方
              </p>
            </div>
            
            {/* 场景选择卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { id: 'anxiety', label: '焦虑不安', icon: '😰', desc: '心神不宁，难以平静' },
                { id: 'fatigue', label: '身心疲惫', icon: '😴', desc: '精力耗竭，需要充电' },
                { id: 'sadness', label: '情绪低落', icon: '😢', desc: '心情郁闷，缺乏动力' },
                { id: 'stress', label: '压力山大', icon: '😤', desc: '工作生活压力重重' },
                { id: 'confusion', label: '迷茫困惑', icon: '😵', desc: '前路不明，需要指引' },
                { id: 'loneliness', label: '孤独寂寞', icon: '🥺', desc: '渴望陪伴与理解' },
              ].map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    handleChatSubmit({ preventDefault: () => {} } as React.FormEvent);
                    // 直接设置输入为场景ID
                    setChatInput(scene.id);
                    // 手动触发发送
                    handleSend(scene.id);
                  }}
                  disabled={isTyping}
                  className="group p-4 bg-emerald-950/50 border border-emerald-500/20 rounded-xl hover:bg-emerald-900/50 hover:border-emerald-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    {scene.icon}
                  </div>
                  <div className="text-emerald-100 font-medium text-sm" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                    {scene.label}
                  </div>
                  <div className="text-emerald-300/60 text-xs mt-1">
                    {scene.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 觉醒日记模式特殊输入区域 */}
        {isPureChatMode && showForm && config.difyType === 'awakening' && messages.length === 0 && (
          <form onSubmit={handleChatSubmit} className="bg-gradient-to-br from-purple-900/80 to-indigo-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-purple-500/30 p-8 mb-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl text-purple-100" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}>
                觉醒日记
              </h3>
              <p className="text-purple-200/70 text-sm mt-2">
                记录当下的觉察，聆听心灵的回响
              </p>
            </div>
            
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="此刻，你感受到了什么？&#10;&#10;写下你的觉察、感悟或困惑..."
              disabled={isTyping}
              rows={6}
              className="w-full px-4 py-4 bg-purple-950/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
            />
            
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={isTyping || !chatInput.trim()}
                className="px-8 py-3 bg-purple-600 text-purple-50 rounded-lg hover:bg-purple-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {isTyping ? '倾听中...' : '倾听回响'}
              </button>
            </div>
          </form>
        )}

        {/* 公案模式特殊展示 */}
        {config.difyType === 'gongan' && messages.length === 0 && (
          <div className="bg-gradient-to-br from-amber-900/80 to-amber-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-amber-600/30 p-8 mb-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🪷</div>
              <h3 className="text-xl text-amber-100 mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}>
                公案参悟
              </h3>
              <p className="text-amber-200/70 text-sm mb-6">
                已参悟 {gonganCount} 次
              </p>
              
              {/* 当前公案 */}
              <div className="bg-amber-950/50 rounded-lg p-6 border border-amber-500/20 mb-6">
                <p className="text-lg text-amber-100 italic" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                  「{currentGongan}」
                </p>
              </div>
              
              {/* 输入回答 */}
              <form onSubmit={handleChatSubmit} className="flex gap-4">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="请说出你的见解..."
                  disabled={isTyping}
                  className="flex-1 px-4 py-3 bg-amber-950/50 border border-amber-500/30 rounded-lg text-amber-100 placeholder-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                />
                <button
                  type="submit"
                  disabled={isTyping || !chatInput.trim()}
                  className="px-6 py-3 bg-amber-600 text-amber-50 rounded-lg hover:bg-amber-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                >
                  {isTyping ? '思忖中...' : '参悟'}
                </button>
              </form>
              
              {/* 切换公案 */}
              <button
                onClick={() => {
                  const gongans = [
                    '如何是祖师西来意？',
                    '什么是佛？',
                    '什么是禅？',
                    '如何是本来面目？',
                    '万法归一，一归何处？',
                    '狗子还有佛性也无？',
                    '如何是无位真人？',
                    '竹影扫阶尘不动，月穿潭底水无痕。如何会？'
                  ];
                  let newGongan = currentGongan;
                  while (newGongan === currentGongan) {
                    newGongan = gongans[Math.floor(Math.random() * gongans.length)];
                  }
                  setCurrentGongan(newGongan);
                }}
                className="mt-4 text-amber-300/60 hover:text-amber-200 text-sm transition-colors"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                换一则公案
              </button>
            </div>
          </div>
        )}

        {/* 消息区域 */}
        {messages.length > 0 && (
          <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 overflow-hidden mb-4 max-h-[60vh] md:max-h-[70vh] flex flex-col">
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {messages.map((msg, idx) => {
                // 处理assistant消息的付费内容分割
                const reportStructure = config.formConfig?.reportStructure || config.conversationConfig?.reportStructure;
                
                if (msg.role === 'assistant' && reportStructure) {
                  const parts = msg.content.split('PREMIUM:');
                  const freePart = parts[0];
                  const premiumPart = parts.length > 1 ? parts[1] : '';

                  return (
                    <div key={idx} className="mb-4 text-left">
                      <div className="inline-block p-3 rounded-lg bg-white/80 max-w-[85%] shadow-sm">
                        <ReportPaywall
                          userRole={userRole}
                          freePart={freePart}
                          premiumPart={premiumPart}
                          premiumSections={reportStructure.premium}
                          reportKey={config.difyType}
                        />
                      </div>
                    </div>
                  );
                }

                // AI疗愈师模式：特殊处方样式（统一用 ZenAvatar 替代差异化 emoji）
                if (config.difyType === 'healing' && msg.role === 'assistant') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="max-w-lg w-full">
                        <div className="bg-gradient-to-br from-emerald-900/80 to-teal-800/60 backdrop-blur-sm rounded-xl border border-emerald-500/30 p-6 shadow-lg">
                          <div className="text-center">
                            <div className="mb-4 flex justify-center">
                              <ZenAvatar size={36} opacity={0.3} style={{ color: '#d1fae5' }} />
                            </div>
                            <p className="text-lg text-emerald-100 whitespace-pre-wrap leading-relaxed"
                               style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                              <MiniMarkdown text={msg.content} className="text-emerald-100 [&_strong]:text-emerald-50 [&_h3]:text-emerald-50 [&_h4]:text-emerald-50 [&_h5]:text-emerald-50" />
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // 觉醒日记模式：特殊回响样式（统一用 ZenAvatar 替代差异化 emoji）
                if (config.difyType === 'awakening' && msg.role === 'assistant') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="max-w-lg w-full">
                        <div className="bg-gradient-to-br from-purple-900/80 to-indigo-800/60 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6 shadow-lg">
                          <div className="text-center">
                            <div className="mb-4 flex justify-center">
                              <ZenAvatar size={36} opacity={0.3} style={{ color: '#e9d5ff' }} />
                            </div>
                            <p className="text-lg text-purple-100 whitespace-pre-wrap leading-relaxed"
                               style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // 普通消息渲染
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <ZenAvatar size={32} opacity={0.2} className="mb-1" />
                    )}
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg flex flex-col ${
                        msg.role === 'user'
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <MiniMarkdown
                          text={msg.content}
                          className="text-sm md:text-base text-gray-800 prose prose-sm max-w-none [&_strong]:font-bold [&_strong]:text-gray-900 [&_p]:my-1 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-2 [&_h4]:text-sm [&_h4]:font-bold [&_h4]:mt-2 [&_h5]:text-sm [&_h5]:font-bold [&_h5]:mt-1"
                        />
                      ) : (
                        <p className="text-sm md:text-base whitespace-pre-wrap" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                          {msg.content}
                        </p>
                      )}
                      {msg.role === 'assistant' && msg.content && msg.content.trim() && (
                        <div className="flex justify-end items-center mt-2 -mb-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (isSpeaking) {
                                stop();
                              } else {
                                speak(msg.content);
                              }
                            }}
                            disabled={isTTSLoading}
                            className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${
                              isSpeaking
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/60'
                            } disabled:opacity-50 disabled:cursor-wait`}
                            aria-label={isSpeaking ? '停止朗读' : '朗读这条消息'}
                            title={isSpeaking ? '停止朗读' : (ttsError ? `朗读失败：${ttsError}` : '点击朗读这条消息')}
                          >
                            {isTTSLoading ? (
                              <>
                                <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                <span>准备中</span>
                              </>
                            ) : isSpeaking ? (
                              <>
                                <span>⏹</span>
                                <span>停止</span>
                              </>
                            ) : (
                              <>
                                <span>🔊</span>
                                <span>朗读</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {isTyping && (
                <InkSpreadAnimation />
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* 纯对话模式的继续输入区域（排除觉醒日记和疗愈师） */}
        {isPureChatMode && messages.length > 0 && !isTyping && config.difyType !== 'awakening' && config.difyType !== 'healing' && (
          <form onSubmit={handleChatSubmit} className="bg-white bg-opacity-80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4 mb-6 pb-safe">
            <div className="flex space-x-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="继续对话..."
                disabled={isTyping}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white disabled:bg-gray-100"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              />
              <button
                type="submit"
                disabled={isTyping || !chatInput.trim()}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {isTyping ? '发送中...' : '发送'}
              </button>
            </div>
          </form>
        )}

        {/* 新咨询按钮 */}
        {messages.length > 0 && !showForm && !isTyping && (
          <div className="text-center">
            <button
              onClick={handleNewConsultation}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", letterSpacing: '2px' }}
            >
              开始新的咨询
            </button>
          </div>
        )}
      </main>
    </div>
    </>
  );
}
