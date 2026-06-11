'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/auth';

export const FREE_TURN_LIMIT = 5;
const storageKey = (tool: string) => `free_turns_${tool}`;

export interface FreeTurnsInfo {
  used: number;
  limit: number;
  /** -1 表示免限（会员/管理员） */
  remaining: number;
  canSend: boolean;
  isExempt: boolean;
  mounted: boolean;
  /** 消费一次配额；返回 true=成功，false=已达上限 */
  consume: () => boolean;
  /** 在 sendMessage 入口调用：未超限则消费并返回 true；超限则跳转 signup 并返回 false */
  trySend: () => boolean;
}

/**
 * 免费对话轮次守卫
 *
 * 规则：
 * - 按工具维度独立计数（localStorage key = `free_turns_${tool}`）
 * - 会员（monthly/yearly）/管理员 免限
 * - 未登录或免费用户每工具 5 轮免费
 * - 第 6 次点发送时跳 `/tong/signup?redirect=<当前路径>`
 * - 邮箱验证后回到 /tong/login?redirect=<原路径>，登录后跳回原页
 *
 * 持久化：localStorage（未登录用户层面足够；登录后可考虑用 Supabase profile 字段加固）
 */
export function useFreeTurns(
  tool: string,
  userRole: UserRole = 'free',
  limit: number = FREE_TURN_LIMIT,
): FreeTurnsInfo {
  const router = useRouter();
  const [used, setUsed] = useState(0);
  const [mounted, setMounted] = useState(false);

  // 首次挂载从 localStorage 读
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(storageKey(tool));
    const parsed = raw ? parseInt(raw, 10) : 0;
    setUsed(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
    setMounted(true);
  }, [tool]);

  const isExempt = userRole === 'member' || userRole === 'admin';
  const remaining = useMemo(
    () => (isExempt ? -1 : Math.max(0, limit - used)),
    [isExempt, limit, used],
  );
  const canSend = isExempt || used < limit;

  const consume = useCallback((): boolean => {
    if (isExempt) return true;
    if (used >= limit) return false;
    const next = used + 1;
    setUsed(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey(tool), String(next));
    }
    return true;
  }, [isExempt, used, limit, tool]);

  const trySend = useCallback((): boolean => {
    if (isExempt) return true;
    if (used >= limit) {
      // 跳注册，附 redirect
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/tong/signup?redirect=${encodeURIComponent(currentPath)}`);
      }
      return false;
    }
    return consume();
  }, [isExempt, used, limit, consume, router]);

  return {
    used,
    limit,
    remaining,
    canSend,
    isExempt,
    mounted,
    consume,
    trySend,
  };
}
