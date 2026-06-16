import { NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { getPolarProductId, type PolarPlan } from '@/lib/polar-constants';

// ============================================
// Polar 支付接口
// ============================================
// 路径：POST/GET /api/create-checkout-session
//
// 设计说明：
//  - POST: PricingPage 按钮调用，body: { plan, userId, email }
//  - GET : 6 处付费墙 window.location.href 直接跳转使用
//         形如 /api/create-checkout-session?type=single&report=pastlife&userId=xxx
//         修复 pre-existing 405 bug（旧实现仅支持 POST，付费墙跳转会失败）
//
//  不硬编码 Access Token——从 process.env.POLAR_ACCESS_TOKEN 读取
//  不硬编码 Base URL——从 process.env.NEXT_PUBLIC_BASE_URL 读取
//  使用 polar.sh 官方 REST API（@polar-sh/sdk），与 @polar-sh/nextjs 的
//  Checkout() 工厂效果等价；本项目用 Next.js 14，而 @polar-sh/nextjs
//  要求 Next.js 15+，故改用底层 SDK。
// ============================================

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
}

function getPolarClient(): Polar {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('POLAR_ACCESS_TOKEN 未配置');
  }
  // sandbox 用于本地联调；生产用 production
  const server = process.env.NEXT_PUBLIC_POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production';
  return new Polar({ accessToken, server });
}

function buildSuccessUrl(plan: PolarPlan, report: string | null): string {
  const base = getBaseUrl();
  if (plan === 'single') {
    return `${base}/tong/profile/subscriptions?success=true&type=single&report=${encodeURIComponent(report || '')}`;
  }
  return `${base}/tong/profile/subscriptions?success=true&type=subscription&plan=${plan}`;
}

interface CheckoutBody {
  plan?: string;
  userId?: string;
  email?: string | null;
  report?: string;
  promotionCode?: string;   // 'first_month' | undefined
}

async function createCheckout(plan: PolarPlan, body: CheckoutBody) {
  const productId = getPolarProductId(plan);
  if (!productId) {
    throw new Error(`未知的 plan: ${plan}`);
  }
  const polar = getPolarClient();
  const base = getBaseUrl();

  // Polar checkout API 不支持 price 字段；price 由 webhook 检测 promotionCode 动态处理
  const checkout = await polar.checkouts.create({
    products: [productId],
    successUrl: buildSuccessUrl(plan, body.report ?? null),
    customerEmail: body.email || undefined,
    metadata: {
      userId: body.userId || '',
      plan,
      report: body.report || '',
      promotionCode: body.promotionCode || '',
      // subscription_start / subscription_end 由 webhook subscription.created 写入
    },
  });
  return checkout;
}

// ============================================
// POST: PricingPage 按钮使用
// ============================================
export async function POST(req: Request) {
  try {
    if (!process.env.POLAR_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Polar 未配置' }, { status: 503 });
    }
    const body = (await req.json().catch(() => ({}))) as CheckoutBody;
    if (!body.userId) {
      return NextResponse.json({ error: '请先登录后再订阅' }, { status: 401 });
    }
    if (!body.plan) {
      return NextResponse.json({ error: '缺少 plan 参数' }, { status: 400 });
    }
    const plan = body.plan as PolarPlan;
    const productId = getPolarProductId(plan);
    if (!productId) {
      return NextResponse.json({ error: '无效的订阅计划' }, { status: 400 });
    }
    const checkout = await createCheckout(plan, body);
    return NextResponse.json({ id: checkout.id, url: checkout.url, plan });
  } catch (error) {
    console.error('Polar checkout POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ============================================
// GET: 6 处付费墙 window.location.href 跳转使用
// ============================================
export async function GET(req: Request) {
  try {
    if (!process.env.POLAR_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Polar 未配置' }, { status: 503 });
    }
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const report = searchParams.get('report');
    const type = searchParams.get('type');   // 'single' | 'subscription'
    const planParam = searchParams.get('plan');
    const promotionCode = searchParams.get('promotionCode') || undefined;

    if (!userId) {
      return NextResponse.json({ error: '请先登录后再订阅' }, { status: 401 });
    }

    let plan: PolarPlan | null = null;
    if (planParam === 'monthly' || planParam === 'yearly') plan = planParam;
    else if (type === 'single') plan = 'single';
    else if (type === 'subscription') plan = 'monthly';

    if (!plan) {
      return NextResponse.json({ error: '无效的订阅计划' }, { status: 400 });
    }

    const safeEmail = (email ?? undefined) as string | undefined;
    const safeUserId = (userId ?? undefined) as string | undefined;
    const safeReport = (report ?? undefined) as string | undefined;
    const checkout = await createCheckout(plan, { plan, userId: safeUserId, email: safeEmail, report: safeReport, promotionCode });
    return NextResponse.json({ id: checkout.id, url: checkout.url, plan });
  } catch (error) {
    console.error('Polar checkout GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
