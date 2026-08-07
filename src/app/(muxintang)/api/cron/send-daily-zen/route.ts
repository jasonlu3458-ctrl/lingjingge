import { NextRequest, NextResponse } from 'next/server';
import { getPushSubscribers, getUserProfile, markZenSent, type UserProfile } from '@/lib/user-profile';
import { generatePersonalizedZenAI, generatePersonalizedPush, type PushContent } from '@/lib/ai-push-utils';
import { sendWebPush } from '@/lib/web-push-helper';

export const dynamic = 'force-dynamic';

function checkCronAuth(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  return request.headers.get('authorization') === `Bearer ${expected}`;
}

/**
 * 发送 Web Push 通知。
 * 优先走 web-push 标准协议（依赖 VAPID 密钥）。当 VAPID 未配置或订阅失效时静默失败。
 * 失败原因已通过 web-push-helper 内部打印，此处只需包装调用。
 */
async function sendPushNotification(
  subscription: any,
  content: PushContent
): Promise<boolean> {
  return await sendWebPush(subscription, content);
}

export async function GET(request: NextRequest) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    message: 'Daily zen notification cron endpoint (personalized)',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Vercel Cron 入口（每日 22:00 UTC）。
 * 1) 拉取所有启用了推送订阅的用户
 * 2) 逐个读取 profile，生成个性化文案
 * 3) 发送 Web Push
 * 4) 标记 last_zen_sent_at（节流）
 */
export async function POST(request: NextRequest) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const startTs = Date.now();
  const subscribers = await getPushSubscribers(500);

  // Dry-run 模式（带 ?dry=1）只生成样本文案，不真发推送
  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dry') === '1';

  // 限制：单次推送最多处理 100 人，避免超时
  const targets = subscribers.slice(0, 100);

  const stats = {
    total: subscribers.length,
    processed: 0,
    sent: 0,
    failed: 0,
    personalized: 0,
    samples: [] as Array<{ userId: string; content: PushContent }>,
  };

  for (const sub of targets) {
    stats.processed++;
    try {
      const profile: UserProfile | null = await getUserProfile(sub.id);
      // 个性化：有画像且有五行 → 走 Dify 增强
      const content = profile?.bazi_profile?.element
        ? await generatePersonalizedZenAI(profile)
        : generatePersonalizedPush(profile);

      if (profile?.bazi_profile?.element) stats.personalized++;

      if (dryRun) {
        stats.samples.push({ userId: sub.id, content });
      } else {
        const ok = await sendPushNotification(sub.subscription, content);
        if (ok) {
          stats.sent++;
          await markZenSent(sub.id);
        } else {
          stats.failed++;
        }
      }
    } catch (e) {
      stats.failed++;
    }
  }

  return NextResponse.json({
    success: true,
    message: dryRun
      ? 'Daily zen cron (dry-run, no push sent)'
      : 'Daily zen cron triggered',
    duration_ms: Date.now() - startTs,
    stats,
    timestamp: new Date().toISOString(),
  });
}
