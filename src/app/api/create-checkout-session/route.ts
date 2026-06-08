import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly',
  yearly: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly',
};

export async function POST(req: Request) {
  try {
    const { priceId, userId, email, plan } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe 未配置' },
        { status: 503 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: '请先登录后再订阅' },
        { status: 401 }
      );
    }

    // 延迟初始化 Stripe 客户端
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-05-27.dahlia',
    });

    let finalPriceId = priceId;
    
    if (plan && PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
      finalPriceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];
    }
    
    if (!finalPriceId) {
      return NextResponse.json(
        { error: '无效的订阅计划' },
        { status: 400 }
      );
    }

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
      customer_email: email,
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
