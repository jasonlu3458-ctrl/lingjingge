import { NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { createClient } from '@supabase/supabase-js';

// ============================================
// Polar Webhook 处理器
// ============================================
// 用 standardwebhooks 验签（Polar 官方推荐）
// 处理订单 / 订阅生命周期事件，持久化到 Supabase
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET || '';

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface PolarCheckoutMetadata {
  userId?: string;
  plan?: string;     // 'single' | 'monthly' | 'yearly'
  report?: string;   // 'pastlife' / 'tili' / ...
  promotionCode?: string;
  orderData?: string; // 吉祥馆订单数据 JSON 字符串
}

interface PolarSubscriptionMetadata {
  userId?: string;
  plan?: string;
  promotionCode?: string;
}

function planToRole(plan?: string): string {
  // 'single' 不影响会员身份，'monthly' / 'yearly' 升级为会员
  if (plan === 'monthly' || plan === 'yearly') return plan;
  return 'free';
}

function statusToDbStatus(s: string): string {
  // Polar: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid'
  // DB:  'active' | 'past_due' | 'canceled' | null
  if (s === 'active' || s === 'trialing') return 'active';
  if (s === 'past_due') return 'past_due';
  if (s === 'canceled' || s === 'incomplete_expired') return 'canceled';
  return s;
}

export async function POST(req: Request) {
  try {
    if (!POLAR_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'POLAR_WEBHOOK_SECRET 未配置' }, { status: 503 });
    }

    // 1. 验签
    const body = await req.text();
    const webhook = new Webhook(POLAR_WEBHOOK_SECRET);

    // Polar 头部: webhooks-id / webhooks-timestamp / webhooks-signature
    const headers: Record<string, string> = {
      'webhook-id': req.headers.get('webhook-id') || '',
      'webhook-timestamp': req.headers.get('webhook-timestamp') || '',
      'webhook-signature': req.headers.get('webhook-signature') || '',
    };

    let event: { type: string; data: any };
    try {
      event = webhook.verify(body, headers) as { type: string; data: any };
    } catch (err) {
      console.error('Polar webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.warn('Supabase 未配置（service role key 缺失），webhook 仅打印日志');
      console.log(`📨 Polar webhook [${event.type}]`, JSON.stringify(event.data).slice(0, 200));
      return NextResponse.json({ received: true, mode: 'no-db' });
    }

    // 2. 分发事件
    switch (event.type) {
      case 'checkout.created':
      case 'checkout.updated': {
        console.log(`📝 Polar checkout ${event.type}: ${event.data?.id}`);
        break;
      }

      case 'order.paid': {
        const order = event.data;
        const metadata = (order?.metadata || {}) as PolarCheckoutMetadata;
        const userId = metadata.userId;
        if (!userId) {
          console.warn('order.paid 缺少 userId metadata');
          break;
        }
        // 单次解锁不写 subscriptions 表，只更新 profiles.subscription_status
        if (metadata.plan === 'single') {
          // 写 report_purchases 表
          const reportType = metadata.report || order?.product?.id || 'unknown';
          const { error: rpErr } = await supabase
            .from('report_purchases')
            .upsert(
              {
                user_id: userId,
                report_type: reportType,
                price: order?.total_amount ? order.total_amount / 100 : 9.9,
                purchased_at: new Date().toISOString(),
                report_id: order?.id || null,
              },
              { onConflict: 'user_id,report_type' }
            );
          if (rpErr && rpErr.code !== '42P01') {
            console.error('report_purchases upsert error:', rpErr);
          }
          console.log(`✅ 用户 ${userId} 单次解锁报告: ${metadata.report}`);
        }

        if (metadata.report === 'jixiangju') {
          try {
            const orderData = metadata.orderData ? JSON.parse(metadata.orderData) : null;
            if (orderData && orderData.items) {
              const { error: moErr } = await supabase
                .from('merchant_orders')
                .insert({
                  tenant_id: 'main',
                  user_id: userId,
                  status: 'paid',
                  total_amount: orderData.total_amount || (order?.total_amount ? order.total_amount / 100 : 0),
                  shipping_address: orderData.shipping_address || null,
                  items: orderData.items,
                  polar_checkout_id: order?.id || null,
                });
              if (moErr) {
                console.error('merchant_orders insert error:', moErr);
              } else {
                console.log(`✅ 用户 ${userId} 吉祥馆订单已保存`);
              }
            }
          } catch (parseErr) {
            console.error('解析订单数据失败:', parseErr);
          }
        }
        break;
      }

      case 'subscription.created':
      case 'subscription.updated': {
        const sub = event.data;
        const metadata = (sub?.metadata || {}) as PolarSubscriptionMetadata;
        const userId = metadata.userId;
        if (!userId) {
          console.warn(`${event.type} 缺少 userId metadata`);
          break;
        }
        const plan = metadata.plan || (sub?.product?.recurring_interval === 'year' ? 'yearly' : 'monthly');
        const role = planToRole(plan);
        const status = statusToDbStatus(sub?.status || 'active');
        const polarSubscriptionId = sub?.id;
        const polarCustomerId = sub?.customer_id || sub?.customer?.id || null;
        const currentPeriodEnd = sub?.current_period_end || sub?.cancel_at_period_end;
        const subscriptionStart = sub?.current_period_start || sub?.started_at;

        // subscription_end 兜底：Polar 数据缺失时按 plan 推算
        let endDateIso: string | null = null;
        if (currentPeriodEnd) {
          endDateIso = new Date(currentPeriodEnd * 1000).toISOString();
        } else {
          const d = new Date();
          if (plan === 'yearly') d.setFullYear(d.getFullYear() + 1);
          else d.setMonth(d.getMonth() + 1);
          endDateIso = d.toISOString();
        }
        const startDateIso = subscriptionStart
          ? new Date(subscriptionStart * 1000).toISOString()
          : new Date().toISOString();

        // 更新 profiles（含 subscription_type 字段）
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({
            role,
            subscription_status: status,
            subscription_start: startDateIso,
            subscription_end: endDateIso,
            subscription_type: plan === 'yearly' ? 'yearly' : 'monthly',
            polar_customer_id: polarCustomerId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
        if (profileErr) console.error('profile update error:', profileErr);

        // 首月特惠：累计一次
        if (metadata.promotionCode === 'first_month') {
          await supabase
            .from('promotion_configs')
            .update({ current_uses: (sub as any)?.__promo_count || 0 })
            .eq('discount_type', 'first_month');
        }

        // 写 subscriptions 表
        if (polarSubscriptionId) {
          const { error: subErr } = await supabase
            .from('subscriptions')
            .upsert(
              {
                user_id: userId,
                plan,
                status,
                polar_subscription_id: polarSubscriptionId,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'polar_subscription_id' }
            );
          if (subErr) console.error('subscription upsert error:', subErr);
        }
        console.log(`✅ 用户 ${userId} 订阅 ${event.type}: plan=${plan}, status=${status}, end=${endDateIso}`);
        break;
      }

      case 'subscription.active': {
        const sub = event.data;
        const metadata = (sub?.metadata || {}) as PolarSubscriptionMetadata;
        const userId = metadata.userId;
        if (userId) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'active', updated_at: new Date().toISOString() })
            .eq('id', userId);
          console.log(`✅ 用户 ${userId} 订阅已激活`);
        }
        break;
      }

      case 'subscription.canceled':
      case 'subscription.revoked': {
        const sub = event.data;
        const metadata = (sub?.metadata || {}) as PolarSubscriptionMetadata;
        const userId = metadata.userId;
        if (!userId) break;

        if (event.type === 'subscription.revoked') {
          // 立即降级为 free
          await supabase
            .from('profiles')
            .update({
              role: 'free',
              subscription_status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        } else {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
        console.log(`❌ 用户 ${userId} 订阅 ${event.type}`);
        break;
      }

      default:
        console.log(`📨 未处理的 Polar 事件类型: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Polar webhook handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
