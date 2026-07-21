/**
 * 牧心堂 · AI 长期记忆（user_memories）读写助手
 *
 * 用途：
 *   - /api/bazi 在排盘后异步写回用户的命盘特征
 *   - /api/dify 在注入 system_prompt 前读取最近一条记忆
 *   - 其他场景（合盘、问询）可按需扩展 key
 *
 * 关键设计：
 *   - writeMemory / readMemory 都是「supabase 未配置就静默返回」的兜底模式
 *   - 写入走 upsert（onConflict: user_id,key），自然支持"覆盖式"记忆
 *   - 读取按 key 过滤 + 按 updated_at desc 拿最近一条
 *   - 不写敏感信息（生辰本身已存 user_profiles；这里只存命盘特征/偏好/事实）
 *
 * 数据示例（key='bazi_profile'）：
 *   {
 *     pillars: { year, month, day, hour },
 *     dayMaster: '丙',
 *     dayMasterElement: '火',
 *     fiveElements: { '金': 0.1, '木': 0.2, '水': 0.15, '火': 0.4, '土': 0.15 },
 *     weakestElement: '金',
 *     deity: '大日如来',
 *     lastReadingAt: '2026-07-03T...',
 *   }
 */

import 'server-only';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';
import type { Json } from '@/types/supabase';

export const MEMORY_KEYS = {
  BAZI_PROFILE: 'bazi_profile',
  MATCH_PROFILE: 'match_profile',
  PREFS: 'prefs',
} as const;

export type MemoryKey = (typeof MEMORY_KEYS)[keyof typeof MEMORY_KEYS];

export async function readMemory(
  userId: string,
  key: MemoryKey | string,
): Promise<Json | null> {
  if (!isSupabaseConfigured()) return null;
  if (!userId) return null;
  try {
    const sb = createClient();

    const { data, error } = await (sb.from('user_memories') as any)
      .select('content, updated_at')
      .eq('user_id', userId)
      .eq('key', key)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn('[memory] read failed:', error.message);
      return null;
    }
    return (data?.content as Json) ?? null;
  } catch (e) {
    console.warn('[memory] read exception:', e);
    return null;
  }
}

export async function listMemories(
  userId: string,
): Promise<Array<{ key: string; content: Json; updatedAt: string }>> {
  if (!isSupabaseConfigured() || !userId) return [];
  try {
    const sb = createClient();

    const { data, error } = await (sb.from('user_memories') as any)
      .select('key, content, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) {
      console.warn('[memory] list failed:', error.message);
      return [];
    }
    return (data ?? []).map((r: { key: string; content: Json; updated_at: string }) => ({
      key: r.key,
      content: r.content,
      updatedAt: r.updated_at,
    }));
  } catch (e) {
    console.warn('[memory] list exception:', e);
    return [];
  }
}

export async function writeMemory(
  userId: string,
  key: MemoryKey | string,
  content: Json,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'unconfigured' };
  }
  if (!userId) {
    return { ok: false, error: 'no_user' };
  }
  try {
    const sb = createClient();

    const { error } = await (sb.from('user_memories') as any).upsert(
      {
        user_id: userId,
        key,
        content,
      },
      { onConflict: 'user_id,key' },
    );
    if (error) {
      console.warn(`[memory] write failed (key=${key}):`, error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.warn(`[memory] write exception (key=${key}):`, e);
    return { ok: false, error: String(e) };
  }
}

export interface ConversationMemory {
  user_id: string;
  tenant_id: string;
  summary: string;
  keywords: string[];
  last_interaction: string;
}

export async function saveConversationMemory(
  userId: string,
  tenantId: string,
  summary: string,
  keywords: string[],
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'unconfigured' };
  }
  if (!userId || !tenantId) {
    return { ok: false, error: 'no_user_or_tenant' };
  }
  try {
    const sb = createClient();

    const { error } = await (sb.from('muxintang_user_memories') as any).upsert(
      {
        user_id: userId,
        tenant_id: tenantId,
        summary,
        keywords,
        last_interaction: new Date().toISOString(),
      },
      { onConflict: 'user_id,tenant_id' },
    );
    if (error) {
      console.warn('[conversation_memory] save failed:', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.warn('[conversation_memory] save exception:', e);
    return { ok: false, error: String(e) };
  }
}

export async function getConversationMemory(
  userId: string,
  tenantId: string,
): Promise<ConversationMemory | null> {
  if (!isSupabaseConfigured()) return null;
  if (!userId || !tenantId) return null;
  try {
    const sb = createClient();

    const { data, error } = await (sb.from('muxintang_user_memories') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) {
      console.warn('[conversation_memory] read failed:', error.message);
      return null;
    }
    return data as ConversationMemory | null;
  } catch (e) {
    console.warn('[conversation_memory] read exception:', e);
    return null;
  }
}

export function memoriesToSystemPrompt(
  memories: Array<{ key: string; content: Json }>,
): string {
  if (!memories.length) return '';
  const lines: string[] = ['【道友长期记忆（阿阇梨记得的）】'];
  for (const m of memories) {
    const intro = MEMORY_INTRO[m.key] ?? '· 备注';
    const body = formatMemoryBody(m.key, m.content);
    if (body) lines.push(`${intro}：${body}`);
  }
  if (lines.length <= 1) return '';
  lines.push('请结合道友的长期特性，给予更贴心、更连贯的开示。');
  return lines.join('\n');
}

const MEMORY_INTRO: Record<string, string> = {
  bazi_profile: '道友上次的命盘特征',
  match_profile: '道友的合盘偏好',
  prefs: '道友偏好',
};

function formatMemoryBody(key: string, content: Json): string {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return '';
  const c = content as Record<string, unknown>;
  if (key === 'bazi_profile') {
    const dm = c.dayMaster ? `${c.dayMaster}（${c.dayMasterElement ?? ''}）` : '';
    const pillars = c.pillars && typeof c.pillars === 'object'
      ? Object.values(c.pillars as Record<string, string>).join(' ')
      : '';
    const weakest = c.weakestElement ? `最弱五行：${c.weakestElement}` : '';
    const deity = c.deity ? `本尊：${c.deity}` : '';
    return [dm, pillars, weakest, deity].filter(Boolean).join(' · ');
  }
  return Object.entries(c)
    .slice(0, 4)
    .map(([k, v]) => `${k}=${typeof v === 'string' || typeof v === 'number' ? v : JSON.stringify(v)}`)
    .join(' · ');
}