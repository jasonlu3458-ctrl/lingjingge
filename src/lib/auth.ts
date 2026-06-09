import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export type UserRole = 'free' | 'member' | 'admin';

/**
 * 检查 Supabase 环境变量是否配置
 */
function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * 获取当前用户的角色
 * @returns 用户角色 ('free' | 'member' | 'admin')
 */
export async function getUserRole(): Promise<UserRole> {
  // 如果 Supabase 未配置，返回默认角色
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    return profile?.role || 'free';
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