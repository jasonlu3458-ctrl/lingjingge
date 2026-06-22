'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useFreeTurns } from './useFreeTurns';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserRole } from '@/lib/auth';
import { trackActivity } from '@/lib/activity-tracker';
import {
  fetchRemoteMessages,
  pushRemoteMessage,
  loadLocalMessages,
  saveLocalMessages,
  type PersistedMessage,
} from '@/lib/chat-persistence';

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

  // —— 对话持久化所需：user_id + conversation_id ——
  const [userId, setUserId] = useState<string | null>(null);
  const conversationIdRef = useRef<string>(
    `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  // 拉当前用户（仅 client）
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!cancelled) setUserId(user?.id ?? null);
      } catch {
        if (!cancelled) setUserId(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 初始化：拉取历史（Supabase 优先，失败回退 localStorage）
  useEffect(() => {
    if (initialMessages.length > 0) return; // 调用方已注入
    const convId = conversationIdRef.current;
    let cancelled = false;

    (async () => {
      // 1) 远端
      if (userId) {
        const remote = await fetchRemoteMessages(userId, convId, type);
        if (cancelled) return;
        if (remote && remote.length > 0) {
          setMessages(
            remote.map((m) => ({ id: m.id, role: m.role, content: m.content }))
          );
          return;
        }
      }
      // 2) 本地兜底
      const local = loadLocalMessages(type, convId);
      if (cancelled) return;
      if (local.length > 0) {
        setMessages(
          local.map((m) => ({ id: m.id, role: m.role, content: m.content }))
        );
      }
    })();

    return () => { cancelled = true; };
  }, [userId, type]);

  /**
   * 写入持久化：远端（已登录时）+ localStorage 兜底。
   * 静默失败（不影响聊天流）。
   */
  const persistMessage = useCallback(
    async (msg: Message) => {
      const convId = conversationIdRef.current;
      // 远端
      if (userId) {
        pushRemoteMessage(userId, convId, type, msg.role, msg.content).catch(() => {});
      }
      // localStorage：合并到按 type 分桶的数组里
      try {
        const raw = typeof window !== 'undefined'
          ? window.localStorage.getItem(`chat_history_${type}`)
          : null;
        const arr: Array<PersistedMessage & { conversation_id: string }> = raw
          ? JSON.parse(raw)
          : [];
        // 同一 convId 内同 id 的去重
        const without = arr.filter(
          (m) => !(m.conversation_id === convId && m.id === msg.id)
        );
        without.push({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          created_at: new Date().toISOString(),
          conversation_id: convId,
        });
        // 总量限制：每个 type 最多保留 200 条
        const trimmed = without.slice(-200);
        saveLocalMessages(type, trimmed);
      } catch {
        /* ignore */
      }
    },
    [userId, type]
  );

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
    // 持久化用户消息（远端 + 本地）
    persistMessage(userMessage);

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

      // 流式结束：持久化助手消息
      if (fullResponse) {
        const assistantMessage: Message = {
          id: messageId,
          role: 'assistant',
          content: fullResponse,
        };
        persistMessage(assistantMessage);
        // 活动埋点：AI 对话完成
        trackActivity('ask', undefined, {
          module: type,
          question_length: (content || '').length,
          answer_length: fullResponse.length,
        }).catch(() => undefined);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      const fallback: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，AI服务暂时不可用，请稍后重试。',
      };
      setMessages(prev => [...prev, fallback]);
      persistMessage(fallback);
    } finally {
      setIsLoading(false);
    }
  }, [type, isLoading, mounted, trySend, persistMessage]);

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
