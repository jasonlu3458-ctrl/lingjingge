import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export type UserRole = 'free' | 'member' | 'admin';

/**
 * 获取当前用户的角色
 * @returns 用户角色 ('free' | 'member' | 'admin')
 */
export async function getUserRole(): Promise<UserRole> {
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