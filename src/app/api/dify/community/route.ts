import { NextRequest, NextResponse } from 'next/server';

/**
 * 社区助手 API
 * 
 * 支持的功能：
 * 1. classify: 帖子分类
 * 2. knowledge: 知识库问答
 * 3. essence: 精华识别
 * 4. topic: 话题生成
 */

export async function POST(req: Request) {
  try {
    const { type, content, user } = await req.json();

    const apiKey = process.env.DIFY_COMMUNITY_API_KEY;

    // 根据 type 构造不同的提示词
    let prompt = '';
    switch (type) {
      case 'classify':
        prompt = `请判断以下帖子类别（问卦/心得/求助/分享）：${content}`;
        break;
      case 'knowledge':
        prompt = `请从知识库中检索并回答：${content}`;
        break;
      case 'essence':
        prompt = `请判断以下内容是否为精华：${content}`;
        break;
      case 'topic':
        prompt = `今天是 ${content}，请生成一个今日参究话题。`;
        break;
      default:
        return NextResponse.json(
          { error: '未知的操作类型' },
          { status: 400 }
        );
    }

    // 如果没有 API Key，返回 Mock 数据
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        type,
        result: getMockResponse(type, content)
      });
    }

    // 调用 Dify
    const response = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: prompt,
        user: user || 'lingjingge-user',
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Dify API 错误: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json({ 
      success: true, 
      type,
      result: data.answer 
    });

  } catch (error) {
    console.error('Community API 错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * Mock 响应数据（当没有 API Key 时使用）
 */
function getMockResponse(type: string, content: string): string {
  switch (type) {
    case 'classify':
      // 同修论坛帖子分类逻辑
      // 问卦 - 运气、卦、占卜
      if (content.includes('运气') || content.includes('卦') || content.includes('占卜')) {
        return '问卦';
      }
      // 心得 - 孩子、教育、亲子、禅、打坐、冥想、身体、健康、养生
      if (content.includes('孩子') || content.includes('教育') || content.includes('亲子') ||
          content.includes('禅') || content.includes('打坐') || content.includes('冥想') ||
          content.includes('身体') || content.includes('健康') || content.includes('养生')) {
        return '心得';
      }
      // 求助 - 情绪、焦虑、压力
      if (content.includes('情绪') || content.includes('焦虑') || content.includes('压力')) {
        return '求助';
      }
      // 默认返回心得
      return '心得';

    case 'knowledge':
      const knowledgeBase: Record<string, string> = {
        '禅宗': '禅宗是佛教的一个重要流派，起源于印度，传至中国后发扬光大。其核心思想是"直指人心，见性成佛"，强调通过禅定修行，觉悟自性。禅宗不立文字，以心传心，主张在日常生活中修行。',
        '正念': '正念源于佛教禅修，是一种专注于当下、不评判的觉察方式。通过有意识地关注当下的呼吸、身体感受、情绪和想法，培养专注力和觉知力。',
        '易经': '《易经》是中国古代经典之一，被誉为"群经之首"。它以阴阳变化为理论基础，通过八卦和六十四卦来阐述天地人事的变化规律。',
        '冥想': '冥想是一种心灵修炼的方法，通过静坐和专注，达到身心放松和意识提升的效果。常见的方式包括呼吸冥想、正念冥想、慈心禅等。',
      };
      for (const [key, value] of Object.entries(knowledgeBase)) {
        if (content.includes(key)) {
          return value;
        }
      }
      return `关于"${content}"的知识，正在从知识库中检索相关信息...`;

    case 'essence':
      const hasDepth = content.length > 200;
      const hasQuestion = content.includes('？') || content.includes('?');
      const hasReflection = content.includes('感悟') || content.includes('体会');
      const hasQuote = content.includes('"') || content.includes('「');
      const score = [hasDepth, hasQuestion, hasReflection, hasQuote].filter(Boolean).length;
      
      if (score >= 3) {
        return '是精华：内容深入，有独到见解，结合了实践体会和经典引用。';
      } else if (score >= 2) {
        return '是精华：内容有一定的深度和思考。';
      } else {
        return '暂不列为精华：内容较为简单，缺乏深度分析。';
      }

    case 'topic':
      const topics = [
        '什么是真正的放下？',
        '如何在生活中修行？',
        '如何面对焦虑和压力？',
        '什么是觉醒的征兆？',
        '如何培养正念的习惯？',
        '怎样看待命运与自由意志？',
        '如何在喧嚣中保持内心平静？',
        '什么是禅宗的核心智慧？',
      ];
      const seed = content.split('-').reduce((acc, num) => acc + parseInt(num), 0);
      return `今日参究：${topics[seed % topics.length]}`;

    default:
      return '未知类型';
  }
}

// GET 方法用于测试
export async function GET() {
  return NextResponse.json({
    message: 'Community Assistant API',
    supported_types: ['classify', 'knowledge', 'essence', 'topic'],
    example: {
      classify: 'POST with { type: "classify", content: "我最近运势不好" }',
      knowledge: 'POST with { type: "knowledge", content: "什么是禅宗？" }',
      essence: 'POST with { type: "essence", content: "一篇深度帖子内容..." }',
      topic: 'POST with { type: "topic", content: "2026-06-07" }'
    }
  });
}
