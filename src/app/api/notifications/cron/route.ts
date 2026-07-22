export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const MORNING_MESSAGES = [
  '清晨好。一日之计在于晨，愿您今日心如止水，诸事顺遂。',
  '早安。晨光熹微，万物苏醒，愿您心怀喜悦，迎接新的一天。',
  '晨安。静心观照，觉察当下，愿您今日平安喜乐。',
  '清晨吉祥。愿您以清净心待人，以慈悲心处事，万事皆安。',
  '早安。心如明镜，不惹尘埃，愿您今日智慧增长，福泽绵长。',
  '晨安。菩提本无树，明镜亦非台，愿您在平凡中见真意。',
  '清晨好。日出东方，光照大千，愿您心中常亮明灯一盏。',
  '早安。一花一世界，一叶一菩提，愿您在细微处见天地。',
];

function getRandomMorningMessage(): string {
  return MORNING_MESSAGES[Math.floor(Math.random() * MORNING_MESSAGES.length)];
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: '无效的密钥' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[cron] Supabase 未配置');
      return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 });
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription');

    if (error) {
      console.error('[cron] get subscriptions error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const message = getRandomMorningMessage();
    let successCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions || []) {
      try {
        const subscription = JSON.parse(sub.subscription);
        const payload = JSON.stringify({
          title: '阿阇梨晨音',
          body: message,
          icon: '/favicon.ico',
          url: '/',
        });

        const result = await sendNotification(subscription as PushSubscription, payload);

        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          if (result.expired) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscription.endpoint);
          }
        }
      } catch (e) {
        console.warn('[cron] process subscription error:', e);
        failedCount++;
      }
    }

    console.log(`[cron] 晨音推送完成: 成功 ${successCount}, 失败 ${failedCount}`);

    return NextResponse.json({
      success: true,
      message: '晨音推送完成',
      sent: successCount,
      failed: failedCount,
      total: (subscriptions || []).length,
    });
  } catch (error) {
    console.error('[cron] exception:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

async function sendNotification(subscription: PushSubscription, payload: string) {
  try {
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEB_PUSH_KEY}`,
      },
      body: payload,
    });

    if (response.status === 410) {
      return { success: false, expired: true };
    }

    if (!response.ok) {
      return { success: false, expired: false };
    }

    return { success: true, expired: false };
  } catch {
    return { success: false, expired: false };
  }
}
