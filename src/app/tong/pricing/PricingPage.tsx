'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  start_date: string | null;
  end_date: string | null;
  product_id: string | null;
  max_uses: number | null;
  current_uses: number | null;
}

interface PromotionResponse {
  ok: boolean;
  promotions?: Promotion[];
  mock?: boolean;
  error?: string;
}

interface Plan {
  name: string;
  description: string;
  basePrice: number;          // 月价 / 年价
  period: string;
  features: string[];
  cta: string;
  popular: boolean;
  role: 'free' | 'monthly' | 'yearly';
  highlight?: { title: string; content: string };
}

const PLANS: Plan[] = [
  {
    name: '云游',
    description: '初入灵境，探索智慧',
    basePrice: 0,
    period: '永久',
    features: [
      '每日参悟禅语',
      'AI禅师基础对话',
      '体质观察问卷',
      '取名轩基础版',
      '藏经阁原文浏览',
    ],
    cta: '免费使用',
    popular: false,
    role: 'free',
  },
  {
    name: '行者',
    description: '精进修行，感悟真谛',
    basePrice: 29.9,
    period: '/月',
    highlight: {
      title: '✓ 解锁全部 7 份 AI 报告（价值 ¥399）',
      content:
        '含：照见前尘 · AI 生命密码 · AI 易理师 · AI 亲子导师 · AI 疗愈师 · AI 体质观察 · AI 炼体师',
    },
    features: [
      '云游全部权益',
      'AI禅师高级对话',
      '取名轩升级版',
      '藏经阁全文阅读',
      '会员专属内容',
      '每月免费取名 3 次',
    ],
    cta: '立即订阅',
    popular: true,
    role: 'monthly',
  },
  {
    name: '真人',
    description: '通达大道，明心见性',
    basePrice: 299,
    period: '/年',
    features: [
      '行者全部权益',
      'AI禅师私密对话',
      '体质定制养生方案',
      '取名轩专家版',
      '专属客服支持',
      '优先体验新功能',
      '无限取名次数',
      '赠送《道德经》深度解读音频',
    ],
    cta: '立即订阅',
    popular: false,
    role: 'yearly',
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [firstMonthPromo, setFirstMonthPromo] = useState<Promotion | null>(null);
  const [promoLoading, setPromoLoading] = useState(true);
  // 年付"名额仅剩 X 个"：mock 一个库存数据；后端化时换成 GET /api/promotions/yearly-quota
  const [yearlyQuotaLeft] = useState<number>(28);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoggedIn(false);
      setAuthLoading(false);
      return;
    }
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          setIsLoggedIn(false);
        } else if (user) {
          setIsLoggedIn(true);
          setUserEmail(user.email || null);
          setUserId(user.id);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // 读取首月特惠
  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const r = await fetch('/api/promotions/active?type=first_month', { cache: 'no-store' });
        const d: PromotionResponse = await r.json();
        if (d.ok && d.promotions && d.promotions.length > 0) {
          setFirstMonthPromo(d.promotions[0]);
        }
      } catch {
        // ignore — 不显示特惠
      } finally {
        setPromoLoading(false);
      }
    };
    fetchPromo();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zen-beige flex items-center justify-center">
        <p className="text-zen-ink/60">加载中...</p>
      </div>
    );
  }

  const handleSubscribe = async (plan: Plan) => {
    if (plan.role === 'free') {
      window.location.href = '/tong/profile';
      return;
    }
    if (!isLoggedIn || !userId) {
      window.location.href = '/tong/login?redirect=/tong/pricing';
      return;
    }
    setLoading(plan.role);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.role,
          userId: userId,
          email: userEmail,
          promotionCode: plan.role === 'monthly' && firstMonthPromo ? 'first_month' : undefined,
        }),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        if (data.error === '请先登录后再订阅') {
          window.location.href = '/tong/login?redirect=/tong/pricing';
        } else {
          alert(data.error || '订阅失败，请稍后重试');
        }
      }
    } catch (e) {
      console.error(e);
      alert('订阅失败，请稍后重试');
    } finally {
      setLoading(null);
    }
  };

  // 月付是否显示首月特惠
  const showFirstMonth =
    firstMonthPromo && firstMonthPromo.discount_value > 0 && firstMonthPromo.discount_value < 29.9;

  return (
    <div className="min-h-screen bg-zen-beige">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zen-ink mb-4">会员订阅</h1>
          <p className="text-zen-ink/70 text-lg">选择适合您的修行之路，开启智慧之旅</p>
          {isLoggedIn && userEmail && (
            <p className="text-zen-ink/50 text-sm mt-2">当前登录：{userEmail}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            const isMonthly = plan.role === 'monthly';
            const isYearly = plan.role === 'yearly';
            const discounted = isMonthly && showFirstMonth && firstMonthPromo;
            const displayPrice = discounted ? firstMonthPromo.discount_value : plan.basePrice;
            return (
              <div
                key={plan.role}
                className={`relative bg-white rounded-xl shadow-lg overflow-hidden ${
                  plan.popular ? 'ring-2 ring-zen-ink' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-zen-ink text-white text-xs px-3 py-1">
                    推荐
                  </div>
                )}

                <div className="p-8">
                  <h2 className="text-2xl font-bold text-zen-ink mb-2">{plan.name}</h2>
                  <p className="text-zen-ink/60 text-sm mb-6">{plan.description}</p>

                  <div className="mb-4">
                    {plan.role === 'free' ? (
                      <span className="text-4xl font-bold text-zen-ink">免费</span>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        {discounted && (
                          <span className="text-base text-gray-400 line-through">
                            ¥{plan.basePrice}
                          </span>
                        )}
                        <span className="text-4xl font-bold text-zen-ink">
                          ¥{displayPrice}
                        </span>
                        <span className="text-zen-ink/60">{plan.period}</span>
                        {discounted && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                            首月特惠
                          </span>
                        )}
                      </div>
                    )}
                    {discounted && (
                      <div className="text-xs text-rose-600 mt-1">
                        续费恢复 ¥{plan.basePrice}/月 · 随时可取消
                      </div>
                    )}
                  </div>

                  {/* 年付：名额仅剩 */}
                  {isYearly && yearlyQuotaLeft > 0 && (
                    <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      ⏳ 名额仅剩 <span className="font-bold">{yearlyQuotaLeft}</span> 个，赠《道德经》深度解读音频
                    </div>
                  )}

                  {/* 套餐高亮权益块 */}
                  {plan.highlight && (
                    <div className="mb-6 p-4 bg-[#fff5f3] border border-[#f5d4cc] rounded-lg">
                      <div className="text-lg font-bold text-[#b85a4a] mb-2">
                        {plan.highlight.title}
                      </div>
                      <div className="text-sm text-gray-600">{plan.highlight.content}</div>
                    </div>
                  )}

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-zen-ink/80 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading === plan.role || promoLoading}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-zen-ink text-white hover:bg-zen-ink/80'
                        : 'bg-zen-gray text-zen-ink hover:bg-zen-gray/80'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading === plan.role
                      ? '处理中…'
                      : plan.role === 'free'
                        ? '免费使用'
                        : discounted
                          ? `首月 ¥${displayPrice} 立即体验`
                          : '立即订阅'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-zen-ink/50 text-sm">
          所有订阅均可随时取消 | 支持微信支付、支付宝
        </div>
      </div>
    </div>
  );
}
