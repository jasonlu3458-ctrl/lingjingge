import { useState, useEffect, useCallback } from 'react';

interface UseAIChatOptions {
  appName: string;
  storageKey?: string;
  initialInputs?: Record<string, any>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface UseAIChatReturn {
  conversationId: string | null;
  loading: boolean;
  error: string | null;
  answer: string;
  streamingContent: string;
  isStreaming: boolean;
  messages: Message[];
  sendMessage: (query: string, extraInputs?: Record<string, any>) => Promise<void>;
  appendAnswer: (newText: string) => void;
  resetConversation: () => void;
  sendFeedback: (type: 'useful' | 'useless') => Promise<void>;
}

export function useAIChat(options: UseAIChatOptions): UseAIChatReturn {
  const { appName, storageKey, initialInputs = {} } = options;
  
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // 初始化 conversationId
  useEffect(() => {
    const key = storageKey || `conv_${appName}`;
    let id = localStorage.getItem(key);
    if (!id) {
      id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(key, id);
    }
    setConversationId(id);
  }, [appName, storageKey]);

  const sendMessage = useCallback(async (query: string, extraInputs?: Record<string, any>) => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);
    setIsStreaming(true);
    setStreamingContent('');
    setAnswer('');

    try {
      const inputs = { ...initialInputs, ...extraInputs };

      // 添加用户消息到历史
      setMessages(prev => [...prev, {
        role: 'user',
        content: query,
        timestamp: Date.now()
      }]);

      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: appName,
          inputs,
          query,
          conversation_id: conversationId,
        }),
      });

      // 检查是否是流式响应
      const contentType = response.headers.get('content-type');
      const isStreamResponse = contentType && contentType.includes('text/event-stream');

      if (!response.ok) {
        // 非 OK 状态码，尝试解析错误 JSON
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `请求失败: ${response.status}`);
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message.includes('请求失败')) {
            throw parseError;
          }
          throw new Error(`请求失败: ${response.status}`);
        }
      }

      if (isStreamResponse && response.body) {
        // 流式响应处理
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let hasReceivedContent = false;

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // 流结束
              break;
            }

            // 解码数据块
            const chunk = decoder.decode(value, { stream: true });
            
            // 解析 SSE 数据块（Dify 的 SSE 格式）
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.trim() === '') continue;

              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                
                // 跳过 [DONE] 标记
                if (dataStr === '[DONE]') {
                  continue;
                }

                try {
                  const data = JSON.parse(dataStr);
                  
                  // 监听自定义的 conversation_id 事件
                  if (data.event === 'conversation_id' && data.conversation_id) {
                    const newConversationId = data.conversation_id;
                    // 更新状态和 localStorage
                    setConversationId(newConversationId);
                    const key = storageKey || `conv_${appName}`;
                    localStorage.setItem(key, newConversationId);
                    continue;
                  }
                  
                  // 从 Dify 流式响应中提取文本
                  let text = '';
                  
                  if (data.event === 'message_end') {
                    // message_end 事件可能包含最终的完整文本
                    text = data.answer || data.content || data.outputs?.text || '';
                  } else if (data.event === 'message' || data.event === 'assistant') {
                    text = data.answer || data.content || data.text || data.output || '';
                  } else if (data.answer) {
                    text = data.answer;
                  } else if (data.content) {
                    text = data.content;
                  }

                  if (text) {
                    hasReceivedContent = true;
                    fullContent += text;
                    // 更新流式内容状态，用于打字机效果
                    setStreamingContent(prev => prev + text);
                    setAnswer(fullContent);
                  }
                } catch (parseError) {
                  // 如果 JSON 解析失败，尝试直接使用文本
                  if (dataStr && dataStr !== '') {
                    try {
                      const data = JSON.parse(dataStr);
                      if (typeof data === 'string') {
                        hasReceivedContent = true;
                        fullContent += data;
                        setStreamingContent(prev => prev + data);
                        setAnswer(fullContent);
                      }
                    } catch {
                      // 无法解析，直接原样使用
                      hasReceivedContent = true;
                      fullContent += dataStr;
                      setStreamingContent(prev => prev + dataStr);
                      setAnswer(fullContent);
                    }
                  }
                }
              }
            }
          }

          // 流结束后，将 streamingContent 的最终值赋值给 answer（如果还没有设置）
          if (!hasReceivedContent && !fullContent) {
            setError('未收到有效响应');
          } else if (fullContent) {
            // 添加助手消息到历史
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: fullContent,
              timestamp: Date.now()
            }]);
          }

        } catch (streamError) {
          // 流中断错误处理
          console.error('流式响应中断:', streamError);
          
          if (fullContent) {
            // 保留已接收的部分内容
            setAnswer(fullContent);
            setStreamingContent(fullContent);
            setError('回答中断，已显示部分内容');
          } else {
            setError('回答中断，请重试');
          }
        } finally {
          setIsStreaming(false);
        }
      } else {
        // 非流式响应（fallback）
        const data = await response.json();
        const reply = data.data?.outputs?.report || data.data?.outputs?.result || data.answer || '';
        
        if (!reply) {
          throw new Error('Empty response');
        }

        setAnswer(reply);
        setStreamingContent(reply);
        
        // 添加助手消息到历史
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: reply,
          timestamp: Date.now()
        }]);
      }

    } catch (err: any) {
      const errorMessage = err.message || '请求失败';
      setError(errorMessage);
      console.error('发送消息失败:', err);
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  }, [conversationId, appName, initialInputs, storageKey]);

  const appendAnswer = useCallback((newText: string) => {
    setAnswer(prev => prev + '\n\n' + newText);
    setStreamingContent(prev => prev + '\n\n' + newText);
  }, []);

  const resetConversation = useCallback(() => {
    const key = storageKey || `conv_${appName}`;
    localStorage.removeItem(key);
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, newId);
    setConversationId(newId);
    setAnswer('');
    setStreamingContent('');
    setMessages([]);
    setError(null);
  }, [appName, storageKey]);

  const sendFeedback = useCallback(async (type: 'useful' | 'useless') => {
    if (!conversationId) return;

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          page: appName, 
          type, 
          conversation_id: conversationId 
        }),
      });
    } catch (err) {
      console.error('反馈失败', err);
    }
  }, [conversationId, appName]);

  return {
    conversationId,
    loading,
    error,
    answer,
    streamingContent,
    isStreaming,
    messages,
    sendMessage,
    appendAnswer,
    resetConversation,
    sendFeedback,
  };
}
