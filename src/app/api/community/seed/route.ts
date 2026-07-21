import { NextRequest, NextResponse } from 'next/server';

/**
 * 同修社区内容种子 API
 *
 * 用法：
 *   - 在本地/线上用浏览器或 curl 访问一次：POST /api/community/seed
 *   - 即可向 topics 表插入 3 条置顶帖：
 *     1) 每日参究（自动调 /api/daily-zen 拿今日禅机）
 *     2) 每周话题（示例："聊聊你最近读《道德经》的感悟"）
 *     3) 新手必读（发帖规则 + 精华帖评选机制）
 *
 * 幂等：已存在（按 title 唯一识别）则跳过，不重复插入
 *
 * 必须先在 Supabase SQL Editor 跑过 migration 005。
 */

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

interface DailyZenPayload {
  zen?: string;
}

interface SeedResult {
  name: string;
  id: number | null;
  status: 'inserted' | 'skipped' | 'failed';
  reason?: string;
}

async function fetchDailyZen(): Promise<string> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(`${base}/api/daily-zen`, { signal: ctrl.signal });
    clearTimeout(t);
    const data = (await r.json()) as DailyZenPayload;
    return data.zen || '心若止水，波澜不惊。';
  } catch {
    return '心若止水，波澜不惊。';
  }
}

const SEED_POSTS = [
  {
    name: '每日参究',
    title: '【每日参究】今日禅机',
    fallback: '心若止水，波澜不惊。',
    tag: '心得',
    is_pinned: true,
    is_daily: true,
    is_weekly: false,
    is_guide: false,
    content: '', // 由 daily-zen 注入
  },
  {
    name: '每周话题',
    title: '【每周话题】聊聊你最近读道德经的感悟',
    tag: '分享',
    is_pinned: true,
    is_daily: false,
    is_weekly: true,
    is_guide: false,
    content: `各位同修：

本周话题想邀请大家聊聊——你最近在读道德经吗？哪一章让你印象最深？

可以聊聊：
- 哪一句话击中了当下的你？
- 在工作、生活、家庭中如何去行它？
- 有没有想推荐给同修的章节？

格式不限，长短皆可。我们彼此映照，便是最好的共修。

愿大家在分享中相互启发。`,
  },
  {
    name: '新手必读',
    title: '【新手必读】同修社区发帖规则与精华帖评选机制',
    tag: '心得',
    is_pinned: true,
    is_daily: false,
    is_weekly: false,
    is_guide: true,
    content: `欢迎来到同修社区。这里是一片安静、真实、互相照见的园地。

━━━━━━━━━━━━━━━━━━━━
一、发帖规则
━━━━━━━━━━━━━━━━━━━━
1. 真诚为本：记录真实的修行体会、生活感悟、读书心得。
2. 主题清晰：标题写明主题；内容尽量具体、可读。
3. 分类准确：发布前可让 AI 助手自动识别分类（心得 / 分享 / 求助 / 问卦）。
4. 友善表达：不攻击、不评判；不传播未经证实的"神异"。
5. 隐私自护：避免公开真实姓名、电话、住址等敏感信息。

━━━━━━━━━━━━━━━━━━━━
二、精华帖评选机制
━━━━━━━━━━━━━━━━━━━━
符合以下条件的帖子将有机会被评为"精华"：

- 内容深度：200 字以上，且有独到见解或真实体验
- 体悟结合：把经典语句、修学方法、真实生活三者结合起来
- 引发共鸣：能引起同修们的回应与思考（回复数、喜欢数）
- 形式整洁：段落清晰，无大段无意义重复

精华帖将获得：
- 在精华标签页长期置顶展示
- 作者获得精华徽章（社区身份标签）
- 优先出现在同修助手的推荐位

━━━━━━━━━━━━━━━━━━━━
三、关于 AI 自动回帖
━━━━━━━━━━━━━━━━━━━━
新帖发布后，同修助手会先来一条简短的鼓励性回复，
希望能给作者一点暖意。AI 不会代替同修之间的真实交流，
如果愿意，也欢迎在 AI 回复之外继续和真人同修对话。

━━━━━━━━━━━━━━━━━━━━
四、温馨提示
━━━━━━━━━━━━━━━━━━━━
- 每日参究 每日更新一次
- 每周话题 每周五发布，欢迎提前准备
- 任何问题可在求助分类下发帖
- 看见喜欢的帖子可以点赞 —— 这是最温柔的鼓励

愿你我于此同修路上，互为灯烛。`,
  },
];

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase 未配置' }, { status: 503 });
  }

  // 安全：用一个简单密钥防止被公开刷
  const expected = process.env.COMMUNITY_SEED_SECRET;
  if (expected) {
    const got = req.headers.get('x-seed-secret') || '';
    if (got !== expected) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // 1) 拿今日禅机
  const dailyZen = await fetchDailyZen();
  const results: SeedResult[] = [];

  // 2) 写入（用原生 fetch 调 PostgREST，绕开 supabase-js 的 header 校验问题）
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Supabase URL/Key 未配置' }, { status: 503 });
  }

  const REST_HEADERS: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    // 0) 清理 1 天前的历史"每日参究"帖子，避免累积
    //    保留当天的即可（今天的会被插入流程跳过）
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const delUrl = `${SUPABASE_URL}/rest/v1/topics?is_daily=eq.true&created_at=lt.${encodeURIComponent(oneDayAgo)}`;
    const delRes = await fetch(delUrl, {
      method: 'DELETE',
      headers: { ...REST_HEADERS, 'Prefer': 'return=representation' },
    });
    const cleanedRows: Array<{ id: number }> = delRes.ok ? await delRes.json() : [];
    const cleaned = Array.isArray(cleanedRows) ? cleanedRows.length : 0;

    for (let i = 0; i < SEED_POSTS.length; i++) {
      const p = SEED_POSTS[i];
      const title = p.name === '每日参究'
        ? `【每日参究】${dailyZen.split('——')[0].trim().slice(0, 14)}`
        : p.title;
      const content = p.name === '每日参究'
        ? `今日禅机：\n\n${dailyZen}\n\n---\n愿大家在这一句禅机中，遇见今日的自己。`
        : p.content;

      // 检查是否已存在（按 title）
      const existUrl = `${SUPABASE_URL}/rest/v1/topics?select=id&title=eq.${encodeURIComponent(title)}&limit=1`;
      const existRes = await fetch(existUrl, { method: 'GET', headers: REST_HEADERS });
      const existRows: Array<{ id: number }> = existRes.ok ? await existRes.json() : [];

      if (existRows.length > 0) {
        results.push({
          name: p.name,
          id: existRows[0].id,
          status: 'skipped',
          reason: '已存在',
        });
        continue;
      }

      // 插入（user_id 不传，置 null 避免 FK 约束）
      const insertUrl = `${SUPABASE_URL}/rest/v1/topics`;
      const body = {
        user_id: null,
        title,
        content,
        tag: p.tag,
        is_pinned: p.is_pinned,
        is_daily: p.is_daily,
        is_weekly: p.is_weekly,
        is_guide: p.is_guide,
        is_ai_reply: false,
        parent_topic_id: null,
        created_at: new Date().toISOString(),
      };
      const insRes = await fetch(insertUrl, {
        method: 'POST',
        headers: { ...REST_HEADERS, 'Prefer': 'return=representation' },
        body: JSON.stringify(body),
      });

      if (!insRes.ok) {
        const errText = await insRes.text();
        results.push({
          name: p.name,
          id: null,
          status: 'failed',
          reason: `${insRes.status}: ${errText.slice(0, 200)}`,
        });
        continue;
      }

      const rows: Array<{ id: number }> = await insRes.json();
      results.push({
        name: p.name,
        id: rows[0]?.id ?? null,
        status: 'inserted',
      });
    }

    const inserted = results.filter(r => r.status === 'inserted').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({
      success: failed === 0,
      dailyZen,
      summary: { inserted, skipped, failed, cleaned },
      results,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}

// GET：预览 seed 内容（不写入）
export async function GET() {
  const dailyZen = await fetchDailyZen();
  return NextResponse.json({
    message: 'POST 到本接口可一键插入 3 条置顶帖',
    dailyZen,
    posts: SEED_POSTS.map(p => ({
      name: p.name,
      title: p.name === '每日参究' ? '【每日参究】...' : p.title,
      tag: p.tag,
      is_pinned: p.is_pinned,
      is_daily: p.is_daily,
      is_weekly: p.is_weekly,
      is_guide: p.is_guide,
    })),
  });
}
