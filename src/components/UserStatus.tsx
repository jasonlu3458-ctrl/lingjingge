'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function UserStatus({ immersive = false }: { immersive?: boolean } = {}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    // 如果 Supabase 未配置，直接跳过
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('获取 session 失败:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe?.();
    }
  }, [router]);

  const handleLogout = async () => {
    // 1) 调后端 signout 路由(真 Supabase 模式:清掉 sb-* cookie)
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (e) {
      // 路由不存在或网络错误时不影响客户端 signOut
      console.warn('[UserStatus] 调用 /api/auth/signout 失败:', e);
    }
    // 2) 客户端 signOut(mock 模式:写 localStorage;真模式:清本地 token)
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('[UserStatus] supabase.auth.signOut 失败:', e);
      }
    }
    // 3) 强制刷新后跳回首页,清掉内存里残留的 user 引用
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zen-ink/20 border-t-zen-ink rounded-full animate-spin"></div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex items-center space-x-4">
        <span className={`font-medium transition-colors duration-500 ${immersive ? 'text-white/90' : 'text-zen-ink'}`}>
          {session.user.email}
        </span>
        <button
          onClick={handleLogout}
          className={`px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
            immersive
              ? 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/25'
              : 'bg-zen-ink text-white hover:bg-zen-ink/80'
          }`}
        >
          退出
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <a
        href="/tong/login"
        className={`transition-colors font-medium ${
          immersive ? 'text-white/85 hover:text-white' : 'text-zen-ink hover:text-zen-ink/80'
        }`}
      >
        登录
      </a>
      <a
        href="/tong/signup"
        className={`px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
          immersive
            ? 'bg-white text-stone-900 hover:bg-white/90'
            : 'bg-zen-ink text-white hover:bg-zen-ink/80'
        }`}
      >
        注册
      </a>
    </div>
  );
}
