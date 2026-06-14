import { NextRequest, NextResponse } from 'next/server';

/**
 * Dify API 批量测试端点
 */

// Edge runtime —— 出口网络与 Node.js Serverless 不同
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // 所有需要测试的 API
  const apiList = [
    // 问道系列
    { key: 'ai-zen-master', name: 'AI禅师', envKey: 'DIFY_AI_ZEN_MASTER_API_KEY' },
    { key: 'gongan', name: '公案参究', envKey: 'DIFY_GONGAN_API_KEY' },
    { key: 'awakening', name: '觉醒日记', envKey: 'DIFY_AWAKENING_API_KEY' },
    { key: 'mind', name: 'AI疗愈师', envKey: 'DIFY_MIND_API_KEY' },
    { key: 'healing', name: '身心疗愈', envKey: 'DIFY_HEALING_API_KEY' },
    { key: 'parenting', name: 'AI亲子导师', envKey: 'DIFY_PARENTING_API_KEY' },
    { key: 'yili', name: 'AI易理师', envKey: 'DIFY_YILI_API_KEY' },
    { key: 'meditation', name: '正念冥想', envKey: 'DIFY_MEDITATION_API_KEY' },
    
    // 观我系列
    { key: 'health', name: 'AI体质观察', envKey: 'DIFY_HEALTH_API_KEY' },
    { key: 'tili', name: 'AI炼体师', envKey: 'DIFY_TILI_API_KEY' },
    { key: 'name', name: 'AI取名轩', envKey: 'DIFY_NAME_API_KEY' },
    { key: 'mingli', name: 'AI生命密码', envKey: 'DIFY_MINGLI_API_KEY' },
    { key: 'pastlife', name: '照见前尘', envKey: 'DIFY_PASTLIFE_API_KEY' },

    // 藏经系列
    { key: 'library_classics', name: '经典', envKey: 'DIFY_LIBRARY_CLASSICS_API_KEY' },
    { key: 'library_treasure', name: '秘藏', envKey: 'DIFY_LIBRARY_TREASURE_API_KEY' },

    // 同修系列
    { key: 'community_essence', name: '精华区', envKey: 'DIFY_COMMUNITY_ESSENCE_API_KEY' },
    { key: 'community_topics', name: '话题聚合', envKey: 'DIFY_COMMUNITY_TOPICS_API_KEY' },

    // 全局兜底
    { key: 'global_fallback', name: '全局兜底', envKey: 'DIFY_API_KEY' },
  ];

  const results = await Promise.all(
    apiList.map(async (api) => {
      const startTime = Date.now();
      const apiKey = process.env[api.envKey];

      if (!apiKey) {
        return {
          key: api.key,
          name: api.name,
          status: 'error',
          message: '环境变量未配置',
          time: 0,
        };
      }

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 25_000);
        let response: Response;
        try {
          response = await fetch('https://api.dify.ai/v1/chat-messages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: '你好',
              user: 'test-user',
              response_mode: 'blocking',
              inputs: {},
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timer);
        }

        const time = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json();
          const answer = data?.answer ? String(data.answer).slice(0, 60) : '';
          return {
            key: api.key,
            name: api.name,
            status: 'success',
            message: answer ? `OK · ${answer}…` : '连接成功',
            time,
          };
        } else {
          const error = await response.text();
          return {
            key: api.key,
            name: api.name,
            status: 'error',
            message: `HTTP ${response.status}: ${error.slice(0, 200)}`,
            time,
          };
        }
      } catch (error) {
        return {
          key: api.key,
          name: api.name,
          status: 'error',
          message: error instanceof Error ? error.message : '未知错误',
          time: Date.now() - startTime,
        };
      }
    })
  );

  const stats = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    error: results.filter(r => r.status === 'error').length,
  };

  return NextResponse.json({
    success: true,
    stats,
    results,
    timestamp: new Date().toISOString(),
  });
}
