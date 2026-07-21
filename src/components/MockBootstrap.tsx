'use client';

import { useEffect } from 'react';
import { installMockDevTools, isMockSupabaseEnabled } from '@/lib/mock-supabase';

/**
 * 仅在 NEXT_PUBLIC_USE_MOCK_SUPABASE=true 时挂载 window.mockSupabase 调试工具。
 * server 渲染无副作用（useEffect 在 client 才跑）。
 */
export default function MockBootstrap() {
  useEffect(() => {
    if (!isMockSupabaseEnabled()) return;
    installMockDevTools();
  }, []);
  return null;
}
