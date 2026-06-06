'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export default function Health() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    energy: '',
    cold: '',
    digestion: '',
    sleep: '',
    tongueColor: '',
    fatigue: '',
    tongueImage: null as File | null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<{
    constitution: string;
    characteristics: string[];
    suggestions: string[];
  } | null>(null);
  
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
    const savedConversationId = localStorage.getItem('conv_health_uuid');
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

  const questions = [
    {
      id: 'energy',
      question: '您平时的精神状态如何？',
      options: ['精力充沛', '容易疲劳', '精神不振', '时而亢奋时而低落'],
    },
    {
      id: 'cold',
      question: '您是否怕冷或怕热？',
      options: ['怕冷', '怕热', '既怕冷又怕热', '无明显感觉'],
    },
    {
      id: 'digestion',
      question: '您的消化情况如何？',
      options: ['良好', '容易腹胀', '容易腹泻', '容易便秘'],
    },
    {
      id: 'sleep',
      question: '您的睡眠质量如何？',
      options: ['好', '一般', '差'],
    },
    {
      id: 'tongueColor',
      question: '您的舌苔颜色接近哪种？',
      options: ['红色', '白色', '黄色'],
    },
    {
      id: 'fatigue',
      question: '您是否经常感到乏力？',
      options: ['是', '否'],
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, tongueImage: e.target.files![0] }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'health',
          query: `精神状态：${formData.energy}，寒热：${formData.cold}，消化：${formData.digestion}，睡眠：${formData.sleep}，舌苔颜色：${formData.tongueColor}，乏力：${formData.fatigue}`,
          inputs: {
            sleep_quality: formData.sleep,
            tongue_color: formData.tongueColor,
            fatigue: formData.fatigue,
            energy: formData.energy,
            cold: formData.cold,
            digestion: formData.digestion,
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
                  localStorage.setItem('conv_health_uuid', data.conversation_id);
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

      let reportData = fullResult || '分析完成';
      let constitution = '平和体质';
            
      if (reportData.includes('阳虚') || reportData.includes('怕冷')) {
        constitution = '阳虚体质';
      } else if (reportData.includes('阴虚') || reportData.includes('怕热')) {
        constitution = '阴虚体质';
      } else if (reportData.includes('痰湿') || reportData.includes('肥胖')) {
        constitution = '痰湿体质';
      } else if (reportData.includes('湿热')) {
        constitution = '湿热体质';
      } else if (reportData.includes('气虚') || reportData.includes('乏力')) {
        constitution = '气虚体质';
      } else if (reportData.includes('血虚')) {
        constitution = '血虚体质';
      } else if (reportData.includes('血瘀')) {
        constitution = '血瘀体质';
      } else if (reportData.includes('气郁')) {
        constitution = '气郁体质';
      } else if (reportData.includes('特禀')) {
        constitution = '特禀体质';
      }
      
      const lines = reportData.split(/[\n\r]+/).filter(line => line.trim());
      
      setReport({
        constitution: constitution,
        characteristics: lines.slice(0, Math.min(3, lines.length)),
        suggestions: lines.slice(3)
      });
      
      setSubmitted(true);
    } catch (err) {
      console.error('错误信息:', err);
      setError(err instanceof Error ? err.message : '分析失败，请稍后重试');
    } finally {
      setIsLoading(false);
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
          type: 'health',
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
                  localStorage.setItem('conv_health_uuid', data.conversation_id);
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
    setSubmitted(false);
    setStep(1);
    setFormData({
      energy: '',
      cold: '',
      digestion: '',
      sleep: '',
      tongueColor: '',
      fatigue: '',
      tongueImage: null,
    });
    setReport(null);
    setError(null);
    setMessages([]);
  };

  const getRecommendation = (constitution: string) => {
    const recommendations: Record<string, { title: string; description: string; link: string; practice?: string }> = {
      '阳虚体质': {
        title: 'AI炼体师',
        description: '您的体质偏阳虚，建议尝试温和的功法来温补阳气。',
        link: '/tili',
        practice: '八段锦'
      },
      '阴虚体质': {
        title: '正念冥想',
        description: '您的体质偏阴虚，建议通过冥想调节身心，滋养阴液。',
        link: '/meditation',
        practice: '静坐冥想'
      },
      '气虚体质': {
        title: 'AI炼体师',
        description: '您的体质偏气虚，建议通过温和运动增强体质。',
        link: '/tili',
        practice: '太极拳'
      },
      '痰湿体质': {
        title: '身心疗愈',
        description: '您的体质偏痰湿，建议通过调理饮食和运动来化痰祛湿。',
        link: '/healing',
        practice: '调理方案'
      },
      '湿热体质': {
        title: '正念冥想',
        description: '您的体质偏湿热，建议通过冥想清热降火。',
        link: '/meditation',
        practice: '清凉冥想'
      },
      '血虚体质': {
        title: '身心疗愈',
        description: '您的体质偏血虚，建议通过综合调理滋养气血。',
        link: '/healing',
        practice: '养血方案'
      },
      '血瘀体质': {
        title: 'AI炼体师',
        description: '您的体质偏血瘀，建议通过运动活血化瘀。',
        link: '/tili',
        practice: '活血功法'
      },
      '气郁体质': {
        title: 'AI禅师',
        description: '您的体质偏气郁，建议通过禅修疏肝解郁。',
        link: '/chan',
        practice: '禅修对话'
      },
      '特禀体质': {
        title: '身心疗愈',
        description: '您的体质偏特禀，建议通过个性化调理增强体质。',
        link: '/healing',
        practice: '个性化方案'
      },
      '平和体质': {
        title: 'AI炼体师',
        description: '您的体质平和，建议继续保持良好的生活习惯。',
        link: '/tili',
        practice: '养生功法'
      }
    };

    return recommendations[constitution] || {
      title: 'AI炼体师',
      description: '建议通过运动增强体质。',
      link: '/tili',
      practice: '养生功法'
    };
  };

  const currentQuestion = questions[step - 1];

  return (
    <div className="min-h-screen bg-zen-beige">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zen-ink mb-2">体质观察</h1>
          <p className="text-gray-600">中医体质辨识，了解自己的身体状态</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!submitted ? (
          <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8">
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">问题 {step} / {questions.length}</span>
                <span className="text-sm text-gray-600">{Math.round((step / questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-zen-gray rounded-full h-2">
                <div
                  className="bg-zen-ink h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {step <= questions.length ? (
              <div>
                <h2 className="text-xl font-semibold text-zen-ink mb-6">
                  {currentQuestion.question}
                </h2>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <label
                      key={index}
                      className="flex items-center p-4 border border-zen-gray rounded-lg cursor-pointer hover:bg-zen-gray transition-colors"
                    >
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value={option}
                        checked={formData[currentQuestion.id as keyof typeof formData] === option}
                        onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-zen-ink">{option}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                    className="px-6 py-2 border border-zen-ink text-zen-ink rounded-lg hover:bg-zen-gray transition-colors disabled:opacity-50"
                  >
                    上一步
                  </button>
                  <button
                    onClick={() => {
                      if (step < questions.length) {
                        setStep(step + 1);
                      } else {
                        handleSubmit();
                      }
                    }}
                    disabled={!formData[currentQuestion.id as keyof typeof formData] || isLoading}
                    className="px-6 py-2 bg-zen-ink text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '分析中...' : (step === questions.length ? '提交分析' : '下一步')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-6">
            {/* 分析结果 */}
            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8 text-center">
              <div className="text-6xl mb-4">🌿</div>
              <h2 className="text-2xl font-bold text-zen-ink mb-4">分析完成</h2>
              {report ? (
                <>
                  <p className="text-gray-600 mb-6">
                    根据您的问卷回答，初步判断您的体质类型为：
                    <span className="font-semibold text-zen-ink text-xl ml-2">{report.constitution}</span>
                  </p>
                  {report.characteristics && report.characteristics.length > 0 && (
                    <div className="bg-zen-gray rounded-lg p-6 text-left mb-6">
                      <h3 className="font-semibold text-zen-ink mb-3">体质特点：</h3>
                      <ul className="space-y-2 text-gray-700">
                        {report.characteristics.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.suggestions && report.suggestions.length > 0 && (
                    <div className="bg-zen-gray rounded-lg p-6 text-left mb-6">
                      <h3 className="font-semibold text-zen-ink mb-3">养生建议：</h3>
                      <ul className="space-y-2 text-gray-700">
                        {report.suggestions.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* AI 主动推荐 */}
                  {report && (
                    <div className="bg-gradient-to-r from-zen-beige to-white rounded-lg p-6 text-left mb-6 border-2 border-zen-ink border-opacity-20">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-2">💡</span>
                        <h3 className="font-semibold text-zen-ink">AI 智能推荐</h3>
                      </div>
                      {(() => {
                        const recommendation = getRecommendation(report.constitution);
                        return (
                          <div>
                            <p className="text-gray-700 mb-3">{recommendation.description}</p>
                            <Link
                              href={recommendation.link}
                              className="inline-flex items-center px-6 py-3 bg-zen-ink text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                              <span className="mr-2">前往</span>
                              <span className="font-semibold">{recommendation.title}</span>
                              {recommendation.practice && (
                                <span className="ml-2 text-sm opacity-80">
                                  · {recommendation.practice}
                                </span>
                              )}
                              <span className="ml-2">→</span>
                            </Link>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-zen-gray rounded-lg p-6 text-left mb-6">
                  <p className="text-gray-700">分析完成，未能解析详细报告</p>
                </div>
              )}
              <button
                onClick={resetForm}
                className="px-8 py-3 bg-zen-ink text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                重新测试
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
          </div>
        )}
      </main>
    </div>
  );
}