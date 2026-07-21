'use client';

import Link from 'next/link';

const PLANS = [
  {
    name: '入门版',
    price: '免费',
    period: '',
    features: [
      '每日免费测算 1 次',
      '基础八字分析',
      '简单起名推荐',
      '社区基础功能',
    ],
    popular: false,
  },
  {
    name: '进阶版',
    price: '99',
    period: '/月',
    features: [
      '每日免费测算 5 次',
      '完整八字分析报告',
      '专业起名推荐',
      '择日吉时查询',
      '家居环境分析',
      '社区高级功能',
    ],
    popular: true,
  },
  {
    name: '尊享版',
    price: '299',
    period: '/月',
    features: [
      '无限次测算',
      '所有功能解锁',
      '专属阿阇梨咨询',
      '定制化服务',
      '优先技术支持',
      '线下活动邀请',
    ],
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            会员订阅
          </h1>
          <p className="text-[#808080]">选择适合您的会员计划</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div 
              key={plan.name}
              className={`muxintang-card p-8 relative ${plan.popular ? 'border-[#D4AF37]' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#D4AF37] text-[#0a0a0a] text-xs px-4 py-1 rounded-full font-semibold">
                  推荐
                </div>
              )}
              
              <h2 
                className="text-xl font-semibold mb-4 text-center"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
              >
                {plan.name}
              </h2>
              
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-[#808080]">{plan.period}</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-[#808080]">
                    <span className="text-[#D4AF37] mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button 
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.popular 
                    ? 'muxintang-btn' 
                    : 'muxintang-btn-outline'
                }`}
              >
                {plan.price === '免费' ? '立即使用' : '立即订阅'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[#808080] text-sm">
            所有会员计划均支持随时取消。本服务仅供娱乐参考，不构成专业建议。
          </p>
        </div>
      </div>
    </div>
  );
}
