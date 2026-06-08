import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// 价格 ID 配置（需要在 Stripe Dashboard 中创建）
const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly',
  yearly: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly',
};

export async function POST(req: Request) {
  try {
    const { priceId, userId, email, plan } = await req.json();

    // 1. 检查 Stripe 是否已配置
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe 未配置' },
        { status: 503 }
      );
    }

    // 2. 检查用户是否已登录
    if (!userId) {
      return NextResponse.json(
        { error: '请先登录后再订阅' },
        { status: 401 }
      );
    }

    // 3. 检查用户是否已有活跃订阅
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, stripe_subscription_id, subscription_status')
      .eq('id', userId)
      .single();

    // 如果用户已经是付费会员，检查订阅状态
    if (profile?.role && profile.role !== 'free') {
      // 检查订阅是否仍然有效
      if (profile.subscription_status === 'active') {
        return NextResponse.json(
          { error: '您已经是付费会员，无需重复订阅', alreadySubscribed: true },
          { status: 400 }
        );
      }
    }

    // 4. 确定价格 ID
    // 支持两种方式：
    // - 直接传入 Stripe 价格 ID（如 'price_monthly'）
    // - 传入计划名称（如 'monthly', 'yearly'），自动映射
    let finalPriceId = priceId;
    
    // 如果传入的是计划名称而非价格 ID，进行映射
    if (plan && PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
      finalPriceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];
    }
    
    if (!finalPriceId) {
      return NextResponse.json(
        { error: '无效的订阅计划' },
        { status: 400 }
      );
    }

    // 5. 创建或获取 Stripe Customer
    let customerId = profile?.stripe_customer_id;
    
    if (!customerId && email) {
      // 创建新的 Stripe Customer
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;

      // 保存 customer ID 到数据库
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // 6. 创建 Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/tong/profile/subscriptions?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/tong/pricing`,
      customer: customerId,
      customer_email: customerId ? undefined : email,
      metadata: {
        userId,
        plan,
      },
      subscription_data: {
        metadata: {
          userId,
          plan,
        },
      },
    });

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe session creation error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
