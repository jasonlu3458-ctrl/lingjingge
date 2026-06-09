import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import ActivityStats from '@/components/ActivityStats'

interface UserProfile {
  id: string
  email: string | null
  role: string
  created_at?: string
  subscription_status?: string
  subscription_start?: string
  subscription_end?: string
}

const roleInfo: Record<string, { name: string; description: string; color: string; badgeColor: string }> = {
  free: { 
    name: '云游', 
    description: '初入灵境，探索智慧', 
    color: 'bg-gray-100 text-gray-600',
    badgeColor: 'bg-gray-500'
  },
  monthly: { 
    name: '行者', 
    description: '精进修行，感悟真谛', 
    color: 'bg-blue-100 text-blue-600',
    badgeColor: 'bg-blue-500'
  },
  yearly: { 
    name: '真人', 
    description: '通达大道，明心见性', 
    color: 'bg-purple-100 text-purple-600',
    badgeColor: 'bg-purple-500'
  }
}

async function getUserProfile(): Promise<UserProfile | null> {
  // 检查环境变量是否配置
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase 环境变量未配置')
    return null
  }

  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        }
      }
    }
  )

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('认证错误:', authError)
      return null
    }
    
    if (!user) {
      console.log('用户未登录')
      return null
    }

    console.log('用户已登录:', user.email, user.id)

    // 简化查询，只获取表中实际存在的字段
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('获取用户信息失败:', error)
      // 返回基本用户信息，不尝试创建记录
      return {
        id: user.id,
        email: user.email || null,
        role: 'free'
      }
    }

    // 返回用户信息，使用空值合并处理缺失字段
    return {
      id: profile.id || user.id,
      email: profile.email || user.email || null,
      role: profile.role || 'free',
      created_at: profile.created_at,
      subscription_status: profile.subscription_status,
      subscription_start: profile.subscription_start,
      subscription_end: profile.subscription_end
    } as UserProfile
  } catch (error) {
    console.error('获取用户信息异常:', error)
    return null
  }
}

export async function generateMetadata() {
  return {
    title: '个人中心 - 灵境阁',
    description: '查看您的会员信息和权益'
  }
}

export default async function ProfilePage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/tong/login?redirect=/tong/profile')
  }

  const role = roleInfo[profile.role] || roleInfo.free
  const isActive = profile.subscription_status === 'active' || profile.role === 'free'

  return (
    <div className="min-h-screen bg-zen-beige">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-zen-ink mb-4">个人中心</h1>
          <p className="text-zen-ink/70">管理您的账户和会员权益</p>
        </div>

        {/* 修行统计 */}
        <ActivityStats />

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold text-zen-ink mb-2">会员等级</h2>
              <div className="flex items-center gap-3">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${role.color}`}>
                  {role.name}
                </span>
                <span className={`px-2 py-1 rounded text-xs text-white ${role.badgeColor}`}>
                  {isActive ? '有效' : '已过期'}
                </span>
              </div>
              <p className="text-zen-ink/60 mt-2">{role.description}</p>
            </div>
            {profile.role === 'free' && (
              <Link
                href="/tong/pricing"
                className="px-6 py-3 bg-zen-ink text-white rounded-lg hover:bg-zen-ink/80 transition-colors font-semibold"
              >
                升级会员
              </Link>
            )}
          </div>

          {profile.role !== 'free' && profile.subscription_end && (
            <div className="bg-zen-beige/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zen-ink/60 text-sm">订阅到期时间</p>
                  <p className="text-xl font-bold text-zen-ink">
                    {format(new Date(profile.subscription_end), 'yyyy年MM月dd日', { locale: zhCN })}
                  </p>
                </div>
                <Link
                  href="/tong/profile/subscriptions"
                  className="text-zen-ink hover:text-zen-ink/80 text-sm font-medium"
                >
                  查看详情 →
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-zen-ink mb-4">会员权益</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.role === 'yearly' && (
                  <>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        AI禅师私密对话
                      </h4>
                      <p className="text-sm text-purple-600">与AI禅师进行深度私密对话，解答人生困惑</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        体质定制养生方案
                      </h4>
                      <p className="text-sm text-purple-600">根据您的体质定制专属养生方案</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        无限取名次数
                      </h4>
                      <p className="text-sm text-purple-600">享受无限次数的取名服务</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        专属客服支持
                      </h4>
                      <p className="text-sm text-purple-600">获得专属客服一对一服务</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        全站深度报告解锁
                      </h4>
                      <p className="text-sm text-purple-600">所有AI服务的完整报告均可直接查看</p>
                    </div>
                  </>
                )}
                {(profile.role === 'monthly' || profile.role === 'yearly') && (
                  <>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        AI禅师高级对话
                      </h4>
                      <p className="text-sm text-blue-600">解锁高级对话功能，获得更深入的指导</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        体质深度分析
                      </h4>
                      <p className="text-sm text-blue-600">获取详细的体质分析报告</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        取名轩升级版
                      </h4>
                      <p className="text-sm text-blue-600">获取更多取名建议和高级功能</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        会员专属内容
                      </h4>
                      <p className="text-sm text-blue-600">访问会员专属文章和课程</p>
                    </div>
                  </>
                )}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    每日参悟
                  </h4>
                  <p className="text-sm text-gray-600">每日一句禅语，启迪心灵</p>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    藏经阁浏览
                  </h4>
                  <p className="text-sm text-gray-600">浏览东方智慧文章精选</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-zen-ink mb-2">账户信息</h3>
              <p className="text-zen-ink/60">邮箱: {profile.email || '未绑定'}</p>
              {profile.created_at && (
                <p className="text-zen-ink/60 text-sm mt-1">注册时间: {format(new Date(profile.created_at), 'yyyy年MM月dd日', { locale: zhCN })}</p>
              )}
            </div>
            <Link
              href="/tong/profile/subscriptions"
              className="inline-flex items-center px-6 py-3 bg-zen-gray text-zen-ink rounded-lg hover:bg-zen-gray/80 transition-colors font-semibold"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              我的订阅
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}