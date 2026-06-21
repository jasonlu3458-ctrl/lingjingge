'use client';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface PersistedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const LS_PREFIX = 'chat_history_';

/**
 * 读取 localStorage 兜底历史。
 * 即使 Supabase 不可用 / 拉取失败，也能恢复会话。
 */
export function loadLocalMessages(type: string, conversationId: string): PersistedMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + type);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 只返回当前 conversation 的消息
    return parsed
      .filter((m: any) => m && m.conversation_id === conversationId)
      .map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      }));
  } catch {
    return [];
  }
}

/**
 * 写入 localStorage（按 type 分桶，整个 conversations 全存）。
 * 用 conversation_id 过滤读取。
 */
export function saveLocalMessages(
  type: string,
  items: Array<PersistedMessage & { conversation_id: string }>
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_PREFIX + type, JSON.stringify(items));
  } catch {
    /* quota exceeded 等，吞掉 */
  }
}

/**
 * 从 Supabase 拉取历史消息。
 *  - 必须已登录（无 user 则返回 []）
 *  - 失败时返回 null（让调用方回退 localStorage）
 */
export async function fetchRemoteMessages(
  userId: string,
  conversationId: string,
  type: string
): Promise<PersistedMessage[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .eq('conversation_id', conversationId)
      .eq('chat_type', type)
      .order('created_at', { ascending: true });
    if (error) {
      console.warn('[chat-persistence] 拉取历史失败:', error.message);
      return null;
    }
    return (data || []).map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      created_at: r.created_at,
    }));
  } catch (e) {
    console.warn('[chat-persistence] 拉取异常:', e);
    return null;
  }
}

/**
 * 写入单条消息到 Supabase。
 * 失败时返回 false（不抛出），调用方自己兜底。
 */
export async function pushRemoteMessage(
  userId: string,
  conversationId: string,
  type: string,
  role: 'user' | 'assistant',
  content: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !content.trim()) return false;
  try {
    const { error } = await supabase.from('chat_messages').insert({
      user_id: userId,
      conversation_id: conversationId,
      chat_type: type,
      role,
      content,
    });
    if (error) {
      console.warn('[chat-persistence] 写入失败:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[chat-persistence] 写入异常:', e);
    return false;
  }
}
