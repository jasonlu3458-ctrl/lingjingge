'use client';

import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 创建 Supabase 客户端（简化配置，移除复杂的存储设置）
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  // 添加超时配置
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        signal: AbortController.timeout(5000).signal, // 5秒超时
      });
    },
  },
});

export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * 测试数据库连接是否可用
 * @returns true 如果连接成功，false 否则
 */
export async function testSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const timeoutPromise = new Promise<boolean>((_, reject) => {
    setTimeout(() => reject(new Error('连接超时')), 5000);
  });

  const testPromise = supabase
    .from('articles')
    .select('id')
    .limit(1)
    .then(() => true)
    .catch(() => false);

  try {
    return await Promise.race([testPromise, timeoutPromise]);
  } catch {
    return false;
  }
}
