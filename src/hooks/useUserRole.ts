'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserRole } from '@/lib/auth';

const mapProfileRole = (r: string | null | undefined): UserRole => {
  if (r === 'admin') return 'admin';
  if (r === 'monthly' || r === 'yearly') return 'member';
  return 'free';
};

/**
 * 客户端实时获取当前用户角色
 *
 * 与 server-side getUserRole() 对应，但走 supabase-js 客户端查询。
 * 适用场景：需要根据登录/会员状态切换 UI 的 client-only 组件
 * （如藏经阁译文付费墙、术语百科会员彩蛋等）。
 *
 * 流程：
 * 1. 首次取 auth.getUser()，未登录 → 'free'
 * 2. 登录则查 profiles.role，映射为 UserRole
 * 3. 订阅 onAuthStateChange，登录/登出后自动更新
 */
export function useUserRole(): UserRole {
  const [role, setRole] = useState<UserRole>('free');

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let mounted = true;

    const fetchRole = async (userId: string | null) => {
      if (!userId) {
        if (mounted) setRole('free');
        return;
      }
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        if (mounted && !error) {
          setRole(mapProfileRole(profile?.role));
        }
      } catch {
        if (mounted) setRole('free');
      }
    };

    // 初始查询
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) fetchRole(data?.user?.id ?? null);
    });

    // 订阅登录状态变化
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) fetchRole(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return role;
}
