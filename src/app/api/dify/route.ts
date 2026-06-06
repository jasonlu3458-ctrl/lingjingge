import { NextRequest, NextResponse } from 'next/server';

// API Key 映射表
const API_KEY_MAP: Record<string, string | undefined> = {
  'ai-zen-master': process.env.DIFY_AI_ZEN_MASTER_API_KEY,
  'mind': process.env.DIFY_MIND_API_KEY,
  'parenting': process.env.DIFY_PARENTING_API_KEY,
  'yili': process.env.DIFY_YILI_API_KEY,
  'gongan': process.env.DIFY_GONGAN_API_KEY,
  'awakening': process.env.DIFY_AWAKENING_API_KEY,
  'mingli': process.env.DIFY_MINGLI_API_KEY,
  'health': process.env.DIFY_HEALTH_API_KEY,
  'meditation': process.env.DIFY_MEDITATION_API_KEY,
};

// Mock 响应数据
const MOCK_RESPONSES: Record<string, string> = {
  'ai-zen-master': '问道者，心有所惑，必有所得。您的问题是开启智慧之门的钥匙。让我们一起探索内心的奥秘，寻找生命的答案。',
  'mind': '我感受到您此刻的情绪状态。请深呼吸，让自己平静下来。情绪如同天空中的云朵，来来去去，不必执着。接纳当下，便是疗愈的开始。',
  'parenting': '亲子关系是生命中最珍贵的礼物。每个孩子都是独特的灵魂，需要被理解和接纳。耐心倾听，用心陪伴，爱是最好的教育。',
  'yili': '易经云："天行健，君子以自强不息；地势坤，君子以厚德载物。"您所问之事，需顺势而为，静待时机，自有转机。',
  'gongan': '赵州禅师曾云："吃茶去。"公案不在文字，而在当下的体验。放下思虑，直指人心，方见本来面目。',
  'awakening': '觉醒始于觉察。每一个当下都是觉醒的契机。记录你的感悟，便是与内心对话。觉察之光，终将照亮前行的道路。',
  'mingli': '命理之学，源于天地自然之道。通过生辰八字，可以洞察人生轨迹，趋吉避凶。但命运掌握在自己手中，积善之家必有余庆。',
  'health': '养生之道，在于顺应自然。饮食有节，起居有常，不妄作劳。身体是承载灵魂的容器，关爱身体便是善待自己。',
  'meditation': '冥想是通往内心深处的桥梁。在宁静中，我们可以听见自己的声音，找到内心的平静。让思绪如水般流淌，不执着于一念。',
};

// 生成唯一的 conversation_id
const generateConversationId = () => {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 生成模拟的流式响应
const createMockStream = (type: string, conversationId: string) => {
  const responseText = MOCK_RESPONSES[type] || '感谢您的提问，这是一个模拟的回复。';
  
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const chars = responseText.split('');
      let index = 0;
      
      // 发送初始消息
      const initEvent = JSON.stringify({
        event: 'message_start',
        message_id: `msg_${Date.now()}`,
      });
      controller.enqueue(encoder.encode(`data: ${initEvent}\n\n`));
      
      // 逐字发送
      const interval = setInterval(() => {
        if (index >= chars.length) {
          clearInterval(interval);
          
          // 发送消息结束事件
          const endEvent = JSON.stringify({
            event: 'message_end',
            message_id: `msg_${Date.now()}`,
            conversation_id: conversationId,
          });
          controller.enqueue(encoder.encode(`data: ${endEvent}\n\n`));
          
          // 发送 conversation_id 事件
          const convEvent = JSON.stringify({
            event: 'conversation_id',
            conversation_id: conversationId,
          });
          controller.enqueue(encoder.encode(`data: ${convEvent}\n\n`));
          
          // 发送结束标记
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }
        
        // 发送字符块（每次发送2-3个字符）
        const chunkSize = Math.min(3, chars.length - index);
        const chunk = chars.slice(index, index + chunkSize).join('');
        index += chunkSize;
        
        const messageEvent = JSON.stringify({
          event: 'message',
          answer: chunk,
          conversation_id: conversationId,
        });
        controller.enqueue(encoder.encode(`data: ${messageEvent}\n\n`));
      }, 80); // 模拟延迟
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '请求体不是有效的 JSON' },
        { status: 400 }
      );
    }

    // 从请求体中提取参数
    const { type, query, conversation_id, inputs, user } = body;

    // 验证必填参数
    if (!type) {
      return NextResponse.json(
        { error: '缺少类型标识 type' },
        { status: 400 }
      );
    }

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json(
        { error: '缺少查询内容 query' },
        { status: 400 }
      );
    }

    // 2. 根据 type 选择对应的 API Key
    const apiKey = API_KEY_MAP[type];

    console.log(`[Dify API] type: ${type}, apiKey exists: ${!!apiKey}`);

    // 3. 强制使用 Mock 模式进行本地测试（生产环境请注释此行）
    const useMockMode = true;

    // 4. 如果 API Key 未配置或使用 Mock 模式，返回模拟数据
    if (!apiKey || useMockMode) {
      const mockConversationId = (conversation_id && typeof conversation_id === 'string' && conversation_id.trim() !== '') 
        ? conversation_id.trim() 
        : generateConversationId();
      
      return new Response(createMockStream(type, mockConversationId), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 4. 构造工作流模式的请求体对象
    const requestBody: Record<string, any> = {
      inputs: {
        query: query,
        ...((inputs && typeof inputs === 'object') ? inputs : {}),
      },
      response_mode: 'streaming',
      user: user || 'lingjingge-user',
    };

    // 6. 使用 fetch 向 Dify 工作流 API 发送 POST 请求
    const difyResponse = await fetch('https://api.dify.ai/v1/workflows/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // 7. 若 Dify 返回非 2xx 状态码，返回错误
    if (!difyResponse.ok) {
      let errorMessage = `Dify API 请求失败：${difyResponse.status}`;
      try {
        const errorData = await difyResponse.json();
        errorMessage = errorData.message || errorData.detail || errorMessage;
      } catch {
        // 忽略解析错误
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: difyResponse.status }
      );
    }

    // 8. 若成功，直接将 Dify 的响应体作为流式响应返回给前端（透明传输）
    return new Response(difyResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Dify API 代理错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}
