'use client';

import { useState, useCallback, useEffect } from 'react';
import { useFreeTurns } from './useFreeTurns';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserRole } from '@/lib/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseAIChatOptions {
  type: string;
  initialMessages?: Message[];
  /**
   * 服务端注入的用户角色（page.tsx 通过 getUserRole() 传入）
   * 如果不传，hook 会客户端再 fetch 一次
   */
  userRole?: UserRole;
}

export function useAIChat({ type, userRole: serverUserRole, initialMessages = [] }: UseAIChatOptions) {
  // 客户端兜底获取角色（兼容没有 SSR 注入的页面）
  const [clientRole, setClientRole] = useState<UserRole>(serverUserRole || 'free');
  useEffect(() => {
    if (serverUserRole) return;
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled || !user) {
          if (!cancelled) setClientRole('free');
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (cancelled) return;
        const r = profile?.role;
        setClientRole(
          r === 'admin' ? 'admin' :
          r === 'monthly' || r === 'yearly' ? 'member' :
          'free'
        );
      } catch {
        if (!cancelled) setClientRole('free');
      }
    })();
    return () => { cancelled = true; };
  }, [serverUserRole]);

  const effectiveRole = serverUserRole || clientRole;
  const { used, limit, remaining, isExempt, trySend, mounted, canSend } = useFreeTurns(type, effectiveRole);

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // 免费轮次守卫（mounted 之前不阻塞，避免 SSR hydration 抖动）
    if (mounted) {
      const allowed = trySend();
      if (!allowed) return; // 已跳转到 /tong/signup
    }

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
  }, [type, isLoading, mounted, trySend]);

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
    freeTurns: {
      used,
      limit,
      remaining,
      isExempt,
      canSend,
      mounted,
    },
  };
}
