'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function UserStatus() {
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
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    router.push('/');
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
        <span className="text-zen-ink font-medium">{session.user.email}</span>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-zen-ink text-white rounded-lg hover:bg-zen-ink/80 transition-colors text-sm font-semibold"
        >
          退出
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <a href="/tong/login" className="text-zen-ink hover:text-zen-ink/80 transition-colors font-medium">
        登录
      </a>
      <a 
        href="/tong/signup" 
        className="px-4 py-2 bg-zen-ink text-white rounded-lg hover:bg-zen-ink/80 transition-colors text-sm font-semibold"
      >
        注册
      </a>
    </div>
  );
}
