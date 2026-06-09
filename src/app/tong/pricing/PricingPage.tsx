'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const plans = [
  {
    name: '云游',
    description: '初入灵境，探索智慧',
    price: '免费',
    period: '',
    features: [
      '每日参悟禅语',
      'AI禅师基础对话',
      '体质观察问卷',
      '取名轩基础版',
      '藏经阁浏览'
    ],
    cta: '免费使用',
    popular: false,
    role: 'free'
  },
  {
    name: '行者',
    description: '精进修行，感悟真谛',
    price: '29',
    period: '/月',
    features: [
      '云游全部权益',
      'AI禅师高级对话',
      '体质深度分析报告',
      '取名轩升级版',
      '藏经阁全文阅读',
      '会员专属内容',
      '每月免费取名3次'
    ],
    cta: '立即订阅',
    popular: true,
    role: 'monthly'
  },
  {
    name: '真人',
    description: '通达大道，明心见性',
    price: '299',
    period: '/年',
    features: [
      '行者全部权益',
      'AI禅师私密对话',
      '体质定制养生方案',
      '取名轩专家版',
      '专属客服支持',
      '优先体验新功能',
      '无限取名次数',
      '线下活动邀请'
    ],
    cta: '立即订阅',
    popular: false,
    role: 'yearly'
  }
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 如果 Supabase 未配置，直接跳过
    if (!isSupabaseConfigured()) {
      setIsLoggedIn(false);
      setAuthLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('获取用户信息失败:', error);
          setIsLoggedIn(false);
        } else if (user) {
          setIsLoggedIn(true);
          setUserEmail(user.email || null);
          setUserId(user.id);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('认证检查异常:', error);
        setIsLoggedIn(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zen-beige flex items-center justify-center">
        <p className="text-zen-ink/60">加载中...</p>
      </div>
    );
  }

  const handleSubscribe = async (plan: string) => {
    if (plan === 'free') {
      window.location.href = '/profile';
      return;
    }

    if (!isLoggedIn || !userId) {
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    setLoading(plan);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan,
          userId: userId,
          email: userEmail,
          plan: plan,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        if (data.error === 'Not authenticated' || data.error === '请先登录后再订阅') {
          window.location.href = '/login?redirect=/pricing';
        } else if (data.alreadySubscribed) {
          alert('您已经是付费会员，无需重复订阅');
        } else {
          alert(data.error || '订阅失败，请稍后重试');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('订阅失败，请稍后重试');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-zen-beige">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zen-ink mb-4">会员订阅</h1>
          <p className="text-zen-ink/70 text-lg">选择适合您的修行之路，开启智慧之旅</p>
          {isLoggedIn && userEmail && (
            <p className="text-zen-ink/50 text-sm mt-2">当前登录: {userEmail}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.role}
              className={`relative bg-white rounded-xl shadow-lg overflow-hidden ${plan.popular ? 'ring-2 ring-zen-ink' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-zen-ink text-white text-xs px-3 py-1">
                  推荐
                </div>
              )}

              <div className="p-8">
                <h2 className="text-2xl font-bold text-zen-ink mb-2">{plan.name}</h2>
                <p className="text-zen-ink/60 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-zen-ink">{plan.price}</span>
                  <span className="text-zen-ink/60">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-zen-ink/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.role)}
                  disabled={loading === plan.role}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-zen-ink text-white hover:bg-zen-ink/80'
                      : 'bg-zen-gray text-zen-ink hover:bg-zen-gray/80'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plan.role ? '处理中...' : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-zen-ink/50 text-sm">
            所有订阅均可随时取消 | 支持微信支付、支付宝
          </p>
        </div>
      </div>
    </div>
  );
}