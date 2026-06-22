'use client';

import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { isMockSupabaseEnabled, mockSupabaseClient } from './mock-supabase';

// 获取环境变量
function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getSupabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

// 延迟初始化 Supabase 客户端
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function getSupabaseClient(): ReturnType<typeof createSupabaseClient<Database>> | null {
  if (typeof window === 'undefined') {
    // 服务端渲染时返回 null，避免在构建时初始化
    return null;
  }
  
  if (!supabaseInstance) {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    
    if (!url || !key) {
      console.warn('Supabase 环境变量未配置');
      return null;
    }
    
    supabaseInstance = createSupabaseClient<Database>(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  
  return supabaseInstance;
}

// 为了向后兼容，导出一个代理对象
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient<Database>>, {
  get(target, prop) {
    // 优先使用 mock 客户端（本地无 Supabase 项目时）
    if (isMockSupabaseEnabled()) {
      return (mockSupabaseClient as any)[prop];
    }
    const client = getSupabaseClient();
    if (!client) {
      // 如果客户端未初始化，返回一个空函数避免报错
      console.warn('Supabase 客户端未初始化，操作将被忽略');
      return () => ({
        data: null,
        error: new Error('Supabase 未配置'),
      });
    }
    return (client as any)[prop];
  }
});

export function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  
  if (!url || !key) {
    throw new Error('Supabase 环境变量未配置');
  }
  
  return createSupabaseClient<Database>(url, key);
}

export function isSupabaseConfigured(): boolean {
  // mock 模式视为「已配置」，让上层逻辑走完持久化流程
  if (typeof window !== 'undefined') {
    const { isMockSupabaseEnabled } = require('./mock-supabase') as typeof import('./mock-supabase');
    if (isMockSupabaseEnabled()) return true;
  }
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
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

  const testPromise = (async () => {
    try {
      const client = getSupabaseClient();
      if (!client) return false;
      
      await client
        .from('articles')
        .select('id')
        .limit(1);
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await Promise.race([testPromise, timeoutPromise]);
  } catch {
    return false;
  }
}
