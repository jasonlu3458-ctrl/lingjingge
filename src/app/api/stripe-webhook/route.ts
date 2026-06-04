import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error(`Webhook 签名验证失败: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: 'Webhook 签名验证失败' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const plan = session.metadata?.plan || 'monthly';

    if (!email) {
      console.error('未找到邮箱，请确保 Checkout Session 包含 customer_details.email');
      return NextResponse.json({ error: '未找到邮箱' }, { status: 400 });
    }

    console.log(`✅ 用户 ${email} 已升级为 ${plan}`);
  }

  return NextResponse.json({ received: true });
}
