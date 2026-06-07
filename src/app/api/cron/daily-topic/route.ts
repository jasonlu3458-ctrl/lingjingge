import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 每日话题生成定时任务
 * 
 * 功能：
 * 1. 调用Dify生成今日参究话题
 * 2. 创建置顶帖子到社区
 * 
 * 使用方式：
 * - 通过Vercel Cron Jobs定时调用
 * - 或手动触发：POST /api/cron/daily-topic
 */

// 初始化Supabase客户端（使用service role key以绕过RLS）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 需要在环境变量中配置
);

// 生成每日话题
async function generateDailyTopic(): Promise<{ title: string; content: string }> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const apiKey = process.env.DIFY_COMMUNITY_API_KEY;
    
    if (!apiKey) {
      // 没有API Key时使用默认话题
      return getDefaultTopic(today);
    }
    
    const response = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `今天是 ${today}，请生成一个今日参究话题。要求：
1. 话题要与禅修、冥想、东方智慧相关
2. 话题要有深度，能引发思考
3. 话题要简洁，不超过20字
4. 请同时生成一段简短的引导语（100字左右）

格式：
话题：[话题内容]
引导：[引导语]`,
        user: 'cron-job',
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error('Dify API错误:', await response.text());
      return getDefaultTopic(today);
    }

    const data = await response.json();
    const answer = data.answer;
    
    // 解析话题和引导语
    const topicMatch = answer.match(/话题：(.+)/);
    const guideMatch = answer.match(/引导：(.+)/);
    
    const title = topicMatch ? topicMatch[1].trim() : getDefaultTopic(today).title;
    const content = guideMatch ? guideMatch[1].trim() : getDefaultTopic(today).content;
    
    return { title, content };
  } catch (error) {
    console.error('生成话题失败:', error);
    return getDefaultTopic(today);
  }
}

// 默认话题池
function getDefaultTopic(date: string): { title: string; content: string } {
  const topics = [
    { title: '什么是真正的放下？', content: '放下不是逃避，而是面对。今天，让我们一起探讨放下的真谛。' },
    { title: '如何在喧嚣中保持内心平静？', content: '世界喧嚣，内心如何安宁？分享你的方法，共同寻找答案。' },
    { title: '觉察当下的力量', content: '此刻，你觉察到了什么？停下脚步，感受当下的存在。' },
    { title: '修行与生活的平衡', content: '修行不是脱离生活，而是在生活中修行。如何找到平衡？' },
    { title: '面对恐惧的智慧', content: '恐惧是人之常情，如何用智慧面对它？今天，让我们一起探讨。' },
    { title: '慈悲心的培养', content: '慈悲不是软弱，而是力量。如何培养慈悲心？' },
    { title: '正念呼吸的奥秘', content: '呼吸是生命的节奏，正念呼吸是修行的入门。今天，一起感受呼吸。' },
    { title: '无常的智慧', content: '万物皆无常，理解无常，才能活在当下。' },
    { title: '禅与日常生活', content: '禅不在远方，而在日常。如何在生活中践行禅？' },
    { title: '内心的清净道场', content: '每个人内心都有一座清净道场，今天，让我们一起寻找它。' },
  ];
  
  // 根据日期选择话题
  const seed = parseInt(date.replace(/-/g, ''));
  const index = seed % topics.length;
  
  return topics[index];
}

// 创建置顶帖子
async function createPinnedPost(topic: { title: string; content: string }) {
  try {
    const { data, error } = await supabase
      .from('topics')
      .insert({
        user_id: 'system', // 系统用户
        title: `【每日参究】${topic.title}`,
        content: topic.content,
        tag: '分享',
        is_pinned: true, // 置顶
        is_daily: true, // 每日话题标记
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('创建帖子失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('创建帖子异常:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 验证请求来源（可选：添加API密钥验证）
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 生成每日话题
    const topic = await generateDailyTopic();
    
    // 创建置顶帖子
    const post = await createPinnedPost(topic);

    if (!post) {
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      topic,
      post
    });
  } catch (error) {
    console.error('定时任务执行失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// GET方法用于手动测试
export async function GET(req: NextRequest) {
  // 生成话题但不创建帖子（用于测试）
  const topic = await generateDailyTopic();
  
  return NextResponse.json({
    message: 'Daily topic preview',
    topic,
    hint: 'Use POST method to create the pinned post'
  });
}