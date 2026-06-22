import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export type UserRole = 'free' | 'member' | 'admin';

/**
 * profiles.role 数据库原始值 → 应用层 UserRole 映射
 *
 * Bug 修复：数据库存的是 'monthly' / 'yearly'，但应用层 isMember()
 *  是用 `role === 'member'` 判定的。如果直接返回数据库原值，
 *  isMember() 永远返回 false，付费墙失效。
 */
function mapProfileRole(profileRole: string | null | undefined): UserRole {
  if (profileRole === 'monthly' || profileRole === 'yearly') return 'member';
  if (profileRole === 'admin') return 'admin';
  return 'free';
}

function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getUserRole(): Promise<UserRole> {
  // mock 模式:服务端无 Supabase 客户端,直接返回会员,保持与客户端 mock session 一致
  // (用户始终以 tester@lingjingge.local 登录,体验连贯,付费墙默认解锁)
  if (process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true') {
    return 'member';
  }
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 未配置，使用默认角色 free');
    return 'free';
  }
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'free';
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (error || !profile) {
      console.error('获取用户角色失败:', error);
      return 'free';
    }
    return mapProfileRole(profile.role);
  } catch (error) {
    console.error('获取用户角色失败:', error);
    return 'free';
  }
}

/**
 * 检查用户是否为会员
 * @returns boolean
 */
export async function isMember(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'member' || role === 'admin';
}

/**
 * 检查用户是否为管理员
 * @returns boolean
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}