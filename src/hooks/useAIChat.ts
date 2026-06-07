'use client';

import { useState, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseAIChatOptions {
  type: string;
  initialMessages?: Message[];
}

export function useAIChat({ type, initialMessages = [] }: UseAIChatOptions) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // 添加用户消息
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          query: content.trim(),
          user: 'lingjingge-user',
        }),
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let messageId = `assistant-${Date.now()}`;

      // 添加初始的助手消息
      setMessages(prev => [...prev, {
        id: messageId,
        role: 'assistant',
        content: '',
      }]);

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
                  // 更新消息内容
                  setMessages(prev => prev.map(msg =>
                    msg.id === messageId ? { ...msg, content: fullResponse } : msg
                  ));
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，AI服务暂时不可用，请稍后重试。',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [type, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    error,
  };
}
