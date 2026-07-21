'use client';

/**
 * 活动埋点（前端 fire-and-forget）
 *
 * 写入 user_activities 表（migration 010）：
 *   - user_id (服务端从 session 注入)
 *   - activity_type: 'sign_in' | 'meditation' | 'ask' | 'report' | 'check_in' ...
 *   - activity_date: 服务端默认 CURRENT_DATE
 *   - metadata: jsonb
 *
 * 设计：
 *  - fetch + keepalive，失败不影响主流程
 *  - 同一天同类型去重（服务端唯一索引兜底）
 *  - 不阻塞 UI
 */

export type ActivityType =
  | 'sign_in'
  | 'meditation'
  | 'ask'
  | 'report'
  | 'check_in'
  | 'invite'
  | 'read';

interface TrackOptions {
  /** 是否静默（默认 true，失败不抛） */
  silent?: boolean;
  /** 额外元数据 */
  metadata?: Record<string, unknown>;
  /** 活动时长（分钟，冥想/阅读等场景） */
  duration_minutes?: number;
}

let _inFlight: Set<string> = new Set();

/**
 * 触发一次活动记录
 * @param type 活动类型
 * @param duration_minutes 持续分钟数
 * @param metadata 或直接传 options
 */
export async function trackActivity(
  type: ActivityType,
  duration_minutes?: number,
  metadataOrOpts?: Record<string, unknown> | TrackOptions,
): Promise<void> {
  let opts: TrackOptions = {};
  if (metadataOrOpts) {
    if ('silent' in metadataOrOpts || 'metadata' in metadataOrOpts) {
      opts = metadataOrOpts as TrackOptions;
    } else {
      opts = { metadata: metadataOrOpts as Record<string, unknown> };
    }
  }
  if (duration_minutes !== undefined) opts.duration_minutes = duration_minutes;

  // 同 type+date 一日内去重：sessionStorage 短路，避免轰炸
  const today = new Date().toISOString().split('T')[0];
  const key = `${type}:${today}`;
  if (_inFlight.has(key)) return;
  if (typeof window !== 'undefined') {
    try {
      if (sessionStorage.getItem(`track:${key}`) === '1') return;
      sessionStorage.setItem(`track:${key}`, '1');
    } catch {
      /* ignore */
    }
  }
  _inFlight.add(key);

  try {
    await fetch('/api/user/activity/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: type,
        duration_minutes: opts.duration_minutes,
        metadata: opts.metadata,
      }),
      keepalive: true,
    });
  } catch (e) {
    if (!opts.silent) console.warn('[trackActivity]', e);
  } finally {
    // 5 秒后再放行（避免快速连击）
    setTimeout(() => _inFlight.delete(key), 5000);
  }
}
