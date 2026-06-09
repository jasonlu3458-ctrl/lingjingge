'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface UserProfile {
  id: string;
  role: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
  subscription_start?: string;
  subscription_end?: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

const planNames: Record<string, string> = {
  free: '云游免费版',
  monthly: '行者月度会员',
  yearly: '真人年度会员'
};

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    // 如果 Supabase 未配置，直接返回
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        const { data: subscriptionsData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (profileData) {
          setProfile(profileData as UserProfile);
        }
        setSubscriptions((subscriptionsData as Subscription[]) || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  }, []);

  const handleSyncSubscription = useCallback(async () => {
    try {
      const response = await fetch('/api/sync-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to sync subscription:', error);
    }
  }, [fetchData]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setShowSuccess(true);
      handleSyncSubscription();
    } else {
      fetchData();
    }
  }, [fetchData, handleSyncSubscription]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zen-beige">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <p className="text-center text-zen-ink/60">加载中...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-zen-beige">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <h2 className="text-2xl font-bold text-zen-ink mb-4">请登录您的账户</h2>
            <Link href="/login" className="inline-block px-8 py-3 bg-zen-ink text-white rounded-lg hover:bg-zen-ink/80 transition-colors font-semibold">
              立即登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const plan = profile.role || 'free';
  const planName = planNames[plan] || plan;
  const isActive = profile.subscription_status === 'active' || plan === 'free';

  return (
    <div className="min-h-screen bg-zen-beige">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center text-zen-ink/60 hover:text-zen-ink mr-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回个人中心
          </Link>
          <button
            onClick={handleSyncSubscription}
            className="px-4 py-2 text-sm text-zen-ink/60 hover:text-zen-ink transition-colors"
          >
            同步订阅状态
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-zen-ink mb-4">订阅管理</h1>
          <p className="text-zen-ink/70">查看和管理您的会员订阅</p>
        </div>

        {showSuccess && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-6 text-center">
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            订阅成功！您的会员权益已更新
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-zen-ink mb-2">{planName}</h2>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {isActive ? '订阅中' : profile.subscription_status || '已取消'}
              </span>
            </div>
            {isActive && profile.subscription_end && (
              <div className="text-right">
                <p className="text-zen-ink/60 text-sm">到期时间</p>
                <p className="text-xl font-bold text-zen-ink">
                  {format(new Date(profile.subscription_end), 'yyyy年MM月dd日', { locale: zhCN })}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-zen-gray pt-6">
            <h3 className="text-lg font-semibold text-zen-ink mb-4">订阅详情</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-zen-ink/60 text-sm">订阅状态</p>
                <p className="text-zen-ink font-semibold">{isActive ? '正常' : '已取消'}</p>
              </div>
              <div>
                <p className="text-zen-ink/60 text-sm">开始时间</p>
                <p className="text-zen-ink font-semibold">
                  {profile.subscription_start ? format(new Date(profile.subscription_start), 'yyyy年MM月dd日', { locale: zhCN }) : '--'}
                </p>
              </div>
              <div>
                <p className="text-zen-ink/60 text-sm">到期时间</p>
                <p className="text-zen-ink font-semibold">
                  {profile.subscription_end ? format(new Date(profile.subscription_end), 'yyyy年MM月dd日', { locale: zhCN }) : plan === 'free' ? '永久' : '--'}
                </p>
              </div>
              <div>
                <p className="text-zen-ink/60 text-sm">订阅类型</p>
                <p className="text-zen-ink font-semibold">
                  {plan === 'yearly' ? '年度订阅' : plan === 'monthly' ? '月度订阅' : '免费版'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {subscriptions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h3 className="text-lg font-semibold text-zen-ink mb-4">订阅历史</h3>
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-zen-ink">{planNames[sub.plan] || sub.plan}</p>
                    <p className="text-sm text-zen-ink/60">
                      {format(new Date(sub.start_date), 'yyyy年MM月dd日', { locale: zhCN })} - 
                      {sub.end_date ? format(new Date(sub.end_date), 'yyyy年MM月dd日', { locale: zhCN }) : '至今'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    sub.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {sub.status === 'active' ? '有效' : '已取消'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-lg font-semibold text-zen-ink mb-6">管理订阅</h3>
          
          {isActive && plan !== 'free' && (
            <>
              <button className="w-full py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-semibold mb-4">
                取消订阅
              </button>
              <p className="text-red-500 text-sm text-center">
                取消后，您的会员权益将保留至当前订阅周期结束
              </p>
            </>
          )}

          {!isActive && plan !== 'free' && (
            <>
              <button className="w-full py-3 bg-zen-ink text-white rounded-lg hover:bg-zen-ink/80 transition-colors font-semibold mb-4">
                重新订阅
              </button>
              <p className="text-zen-ink/50 text-sm text-center">
                您的订阅已取消，点击重新订阅恢复会员权益
              </p>
            </>
          )}

          {plan === 'free' && (
            <Link
              href="/pricing"
              className="block w-full py-3 bg-zen-ink text-white rounded-lg hover:bg-zen-ink/80 transition-colors font-semibold text-center"
            >
              升级会员
            </Link>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-zen-ink/50 text-sm">
            如有疑问，请联系客服 support@lingjingge.com
          </p>
        </div>
      </div>
    </div>
  );
}
