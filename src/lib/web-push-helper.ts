// ============================================================
// web-push-helper.ts —— Web Push 发送工具
// ------------------------------------------------------------
// 职责：包装 web-push 库，提供 VAPID 鉴权 + 失败降级。
// 依赖：npm i web-push  (项目内已添加至 package.json)
// ============================================================

import webpush from 'web-push';
import type { PushContent } from './ai-push-utils';

let _configured = false;
function ensureConfigured() {
  if (_configured) return true;
  const pub = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
  const priv = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT || 'mailto:admin@lingjingge.com';
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  _configured = true;
  return true;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * 向订阅终端发送一条 Web Push 通知。
 * - VAPID 未配置 → 返回 false（调用方走降级）
 * - 订阅失效（410 Gone）→ 返回 false（调用方应清掉该订阅）
 */
export async function sendWebPush(
  subscription: WebPushSubscription | any,
  content: PushContent
): Promise<boolean> {
  if (!ensureConfigured()) return false;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh) return false;

  try {
    const payload = JSON.stringify({
      title: content.title,
      body: content.body,
      data: { url: content.url, tag: content.tag },
      icon: '/icon-192.png',
      badge: '/badge-72.png',
    });

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      payload,
      { TTL: 60 * 60 * 24, urgency: 'normal' }
    );
    return true;
  } catch (e: any) {
    // 410 Gone：订阅失效，调用方应从 DB 删除
    if (e?.statusCode === 404 || e?.statusCode === 410) {
      console.warn('[web-push] 订阅已失效:', subscription.endpoint);
    } else {
      console.error('[web-push] 发送失败:', e?.message || e);
    }
    return false;
  }
}

/**
 * 公共：给客户端生成 / 获取 VAPID 公钥（用于订阅时的 applicationServerKey）。
 * 不暴露私钥。
 */
export function getPublicVapidKey(): string | null {
  return process.env.WEB_PUSH_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY || null;
}
