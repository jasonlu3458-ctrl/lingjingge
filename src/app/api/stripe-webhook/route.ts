import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    // 检查 Stripe 是否已配置
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Stripe 未配置' },
        { status: 503 }
      );
    }

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: '缺少 Stripe 签名' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // 创建 Supabase 客户端
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );

    // 处理不同的事件类型
    switch (event.type) {
      case 'checkout.session.completed': {
        // 订阅完成
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan || 'monthly';
        const customerId = session.customer as string;

        if (userId) {
          // 获取订阅信息
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // 确定角色
          const role = plan === 'yearly' ? 'yearly' : 'monthly';

          await supabase
            .from('profiles')
            .update({
              role: role,
              subscription_status: subscription.status,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              subscription_start: new Date(subscription.current_period_start * 1000).toISOString(),
              subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', userId);

          console.log(`✅ 用户 ${userId} 订阅成功，角色: ${role}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        // 订阅更新（如续费、方案变更等）
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          const role = subscription.metadata?.plan === 'yearly' ? 'yearly' : 'monthly';

          await supabase
            .from('profiles')
            .update({
              subscription_status: subscription.status,
              stripe_subscription_id: subscription.id,
              subscription_start: new Date(subscription.current_period_start * 1000).toISOString(),
              subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
              // 如果订阅暂停或取消，可能需要降级
              ...(subscription.status !== 'active' && {
                role: 'free',
              }),
            })
            .eq('id', userId);

          console.log(`📝 用户 ${userId} 订阅已更新，状态: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // 订阅取消
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await supabase
            .from('profiles')
            .update({
              role: 'free',
              subscription_status: 'canceled',
              stripe_subscription_id: null,
              subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', userId);

          console.log(`❌ 用户 ${userId} 订阅已取消`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // 支付成功（续费）
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          if (userId) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                subscription_start: new Date(subscription.current_period_start * 1000).toISOString(),
                subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq('id', userId);

            console.log(`💰 用户 ${userId} 续费成功`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        // 支付失败
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          if (userId) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', userId);

            console.log(`⚠️ 用户 ${userId} 支付失败`);
          }
        }
        break;
      }

      default:
        console.log(`未处理的事件类型: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook 处理错误:', error);
    
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
