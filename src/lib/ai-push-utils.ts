// ============================================================
// ai-push-utils.ts —— 个性化推送文案生成器
// ------------------------------------------------------------
// 三层降级：① Dify LLM → ② 本地模板（基于五行/活跃度）→ ③ 静态兜底
//   - 命中画像时 → 个性化模板
//   - 无画像     → 通用模板
//   - 全部失败   → 静态兜底（同修，今日宜静观内心）
// ============================================================

import type { UserBaziProfile, UserProfile } from './user-profile';

export interface PushContent {
  title: string;
  body: string;
  tag: string;
  url: string;
}

/** 五行模板：每个元素 3 条，按时间窗轮换 */
const ELEMENT_TEMPLATES: Record<string, { morning: string; noon: string; evening: string }> = {
  木: {
    morning: '同修，今日木旺，宜舒展筋骨，户外散步 10 分钟。',
    noon: '同修，木气正盛，宜理清思路，把卡点写下来。',
    evening: '同修，木主仁，睡前读一句温柔的话给自己。',
  },
  火: {
    morning: '同修，今日火气上扬，宜慢饮温水，戒急戒躁。',
    noon: '同修，火旺主礼，给同事一句真心感谢。',
    evening: '同修，火归心，今晚宜静坐 5 分钟。',
  },
  土: {
    morning: '同修，土主信，今日先做最重要的一件小事。',
    noon: '同修，土厚载物，宜规律饮食，不忘给自己加餐。',
    evening: '同修，土性稳，睡前回顾今天三件值得感谢的事。',
  },
  金: {
    morning: '同修，金主决断，今日先把拖了三天的决定做掉。',
    noon: '同修，金气正清，宜整理桌面与思路。',
    evening: '同修，金秋宜收敛，睡前少看屏幕 10 分钟。',
  },
  水: {
    morning: '同修，水主智，今日一杯温水，慢慢开始。',
    noon: '同修，水利万物，宜倾听一位朋友的心事。',
    evening: '同修，水性归藏，热水泡脚 10 分钟助眠。',
  },
};

const GENERIC_TEMPLATES = [
  '同修，今日宜静观内心，慢即是快。',
  '同修，一念清明，万事可期。',
  '同修，修行不在远方，就在这一呼一吸。',
  '同修，给自己留 5 分钟，什么都不做。',
  '同修，心安即是归处。',
];

const FALLBACK: PushContent = {
  title: '🪷 牧心堂',
  body: '同修，今日宜静观内心。',
  tag: 'daily-zen',
  url: '/muxintang',
};

function getTimeBucket(): 'morning' | 'noon' | 'evening' {
  const h = new Date().getHours();
  if (h < 11) return 'morning';
  if (h < 18) return 'noon';
  return 'evening';
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 根据用户画像生成个性化推送文案（本地模板，零延迟）。
 */
export function generatePersonalizedPush(profile: UserProfile | null): PushContent {
  if (!profile) {
    return {
      title: '🪷 牧心堂 · 今日禅机',
      body: pickRandom(GENERIC_TEMPLATES),
      tag: 'daily-zen',
      url: '/muxintang',
    };
  }

  // 1) 优先用五行画像
  const bazi = profile.bazi_profile;
  if (bazi?.element && ELEMENT_TEMPLATES[bazi.element]) {
    const bucket = getTimeBucket();
    const body = ELEMENT_TEMPLATES[bazi.element][bucket];
    return {
      title: `🪷 牧心堂 · ${bazi.element}日开示`,
      body,
      tag: 'daily-zen',
      url: '/muxintang/me',
    };
  }

  // 2) 3 天未活跃 → 召回文案
  if (profile.last_active_at) {
    const last = new Date(profile.last_active_at);
    const days = (Date.now() - last.getTime()) / (24 * 3600 * 1000);
    if (days > 3) {
      return {
        title: '🪷 牧心堂',
        body: '同修，三日不见。还记得你上次留的那一盏茶吗？',
        tag: 'daily-zen',
        url: '/muxintang/me',
      };
    }
  }

  // 3) 兜底通用
  return {
    title: '🪷 牧心堂 · 今日禅机',
    body: pickRandom(GENERIC_TEMPLATES),
    tag: 'daily-zen',
    url: '/muxintang',
  };
}

/**
 * AI 增强版：尝试调用 Dify 生成更自然的文案。
 * 失败 / 无 key / 超时 → 回退到本地模板。
 *
 * 设计要点：
 *   - 30s 超时，避免阻塞 cron
 *   - 失败兜底，不抛错
 */
export async function generatePersonalizedZenAI(
  profile: UserProfile | null
): Promise<PushContent> {
  const local = generatePersonalizedPush(profile);
  if (!profile?.bazi_profile?.element) return local;

  const apiKey = process.env.DIFY_PUSH_API_KEY || process.env.NEXT_PUBLIC_DIFY_PUSH_API_KEY;
  if (!apiKey) return local;

  const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');
  const controller = new AbortController();
  // 与 Dify 应用平均调用时间匹配的硬超时（4s）。
  // 设置更长会导致 cron 端积压；设置更短会频繁降级。
  const timer = setTimeout(() => controller.abort(), 4_000);

  try {
    const prompt = `同修今日画像：日主「${profile.bazi_profile.dayStem}」（${profile.bazi_profile.element}）。请生成一句 20-40 字的温馨叮嘱，语气要像一位老朋友。格式：「同修，……」。不要使用感叹号超过 1 个。`;

    const res = await fetch(`${baseUrl}/v1/chat-messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { user_id: profile.id, element: profile.bazi_profile.element },
        query: prompt,
        user: `push-${profile.id}`,
        response_mode: 'blocking',
      }),
      signal: controller.signal,
    });

    if (!res.ok) return local;
    const data = await res.json();
    const answer = (data?.answer || '').trim();
    if (!answer) return local;

    return {
      title: `🪷 牧心堂 · ${profile.bazi_profile.element}日开示`,
      body: answer,
      tag: 'daily-zen',
      url: '/muxintang/me',
    };
  } catch {
    return local;
  } finally {
    clearTimeout(timer);
  }
}
