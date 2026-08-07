// ============================================================
// user-profile.ts —— 用户画像接口（供 cron 推送 + 个性化推荐使用）
// ------------------------------------------------------------
// 数据源：Supabase profiles 表（兼容 user_profiles）。
// 字段约定（写操作时按需新增，写入使用 JSONB 兼容结构）：
//   - bazi_profile     { dayStem, element, fiveElement, deity, ... }
//   - preferences      { ... }
//   - last_active_at   ISO string
//   - last_zen_sent_at ISO string
// ============================================================

import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';

export type WuxingElement = '木' | '火' | '土' | '金' | '水';

export interface UserBaziProfile {
  dayStem: string;
  element: WuxingElement;
  fiveElement?: Record<string, number>;
  deity?: string;
  /** 性格画像快速摘要（用于推送文案） */
  summary?: string;
}

export interface UserProfile {
  id: string;
  email?: string | null;
  bazi_profile?: UserBaziProfile | null;
  preferences?: Record<string, any> | null;
  last_active_at?: string | null;
  last_zen_sent_at?: string | null;
  created_at?: string;
}

const TABLES = ['profiles', 'user_profiles'];

/**
 * 读用户画像（兼容 profiles / user_profiles 表名）。
 * 表不存在或读不到 → 返回 null（不抛错，cron 流程必须可降级）。
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured() || !userId) return null;
  const sb = createClient();
  for (const table of TABLES) {
    try {
      const { data, error } = await (sb.from(table) as any)
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          email: data.email ?? null,
          bazi_profile: data.bazi_profile ?? data.lifecode_profile ?? null,
          preferences: data.preferences ?? null,
          last_active_at: data.last_active_at ?? null,
          last_zen_sent_at: data.last_zen_sent_at ?? null,
          created_at: data.created_at,
        };
      }
    } catch {
      // 表不存在 → 继续尝试下一个
    }
  }
  return null;
}

/**
 * 更新用户的天赋画像（异步失败不抛错，避免阻塞主流程）。
 */
export async function updateUserBaziProfile(
  userId: string,
  baziData: Partial<UserBaziProfile>
): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return false;
  const sb = createClient();
  for (const table of TABLES) {
    try {
      const { error } = await (sb.from(table) as any)
        .update({
          bazi_profile: baziData,
          last_active_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (!error) return true;
    } catch {
      // continue
    }
  }
  return false;
}

/**
 * 记录"上次发送禅机推送"时间（用于节流，避免同一用户一天多次收到）。
 */
export async function markZenSent(userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !userId) return;
  const sb = createClient();
  for (const table of TABLES) {
    try {
      await (sb.from(table) as any)
        .update({ last_zen_sent_at: new Date().toISOString() })
        .eq('id', userId);
      return;
    } catch {
      // continue
    }
  }
}

/**
 * 列出启用了推送订阅的用户（用于 cron 广播）。
 * 退化方案：profiles 表查 is_push_enabled=true 的行；表/字段缺失时返回空数组。
 */
export async function getPushSubscribers(limit = 500): Promise<Array<{ id: string; subscription: any }>> {
  if (!isSupabaseConfigured()) return [];
  const sb = createClient();
  for (const table of TABLES) {
    try {
      const { data, error } = await (sb.from(table) as any)
        .select('id, push_subscription')
        .eq('is_push_enabled', true)
        .limit(limit);
      if (!error && Array.isArray(data)) {
        return data
          .filter((r: any) => r.push_subscription)
          .map((r: any) => ({ id: r.id, subscription: r.push_subscription }));
      }
    } catch {
      // continue
    }
  }
  return [];
}
