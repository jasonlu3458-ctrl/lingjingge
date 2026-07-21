'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * 检测当前是否已登录（客户端实时）
 *
 * 与 useFreeTurns 中的 userRole 配合使用：
 * - userRole === 'free' + !isAuthenticated → 未登录访客
 * - userRole === 'free' +  isAuthenticated → 已登录免费用户
 * - userRole !== 'free'                    → 会员/管理员
 */
export function useIsAuthenticated(): boolean {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsAuth(false);
      return;
    }

    let mounted = true;

    // 初次检测
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setIsAuth(Boolean(data.user));
    });

    // 订阅登录状态变化（注册/登出后自动更新）
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsAuth(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return isAuth;
}
