import { NextRequest, NextResponse } from 'next/server';

// 简单的内存缓存机制
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 检查缓存是否有效
const isCacheValid = (timestamp: number) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// 生成缓存键
const generateCacheKey = (type: string, query: string) => {
  return `${type}:${query.slice(0, 100)}`; // 只取前100字符作为键
};

// API Key 映射表
const API_KEY_MAP: Record<string, string | undefined> = {
  // 问道 (wen/)
  'ai-zen-master': process.env.DIFY_AI_ZEN_MASTER_API_KEY,
  'mind': process.env.DIFY_MIND_API_KEY,
  'parenting': process.env.DIFY_PARENTING_API_KEY,   // 亲子导师
  'yili': process.env.DIFY_YILI_API_KEY,
  'gongan': process.env.DIFY_GONGAN_API_KEY,
  'awakening': process.env.DIFY_AWAKENING_API_KEY,
  'meditation': process.env.DIFY_MEDITATION_API_KEY,
  'healing': process.env.DIFY_HEALING_API_KEY,
  
  // 观心 (guan/)
  'health': process.env.DIFY_HEALTH_API_KEY,
  'mingli': process.env.DIFY_MINGLI_API_KEY,
  'name': process.env.DIFY_NAME_API_KEY,
  'tili': process.env.DIFY_TILI_API_KEY,
  'pastlife': process.env.DIFY_PASTLIFE_API_KEY,  // 照见前尘

  // 藏经 (zang/)
  'library_classics': process.env.DIFY_LIBRARY_CLASSICS_API_KEY,
  'library_treasure': process.env.DIFY_LIBRARY_TREASURE_API_KEY,

  // 同修 (tong/)
  'community_essence': process.env.DIFY_COMMUNITY_ESSENCE_API_KEY,
  'community_topics': process.env.DIFY_COMMUNITY_TOPICS_API_KEY,
};

// 检查哪些 API Key 已配置
const configuredKeys = Object.entries(API_KEY_MAP)
  .filter(([, value]) => value)
  .map(([key]) => key);

console.log('✅ 已配置的 Dify API Key:', configuredKeys);

// Mock 响应数据
const MOCK_RESPONSES: Record<string, string> = {
  'ai-zen-master': '问道者，心有所惑，必有所得。您的问题是开启智慧之门的钥匙。让我们一起探索内心的奥秘，寻找生命的答案。',
  'mind': '我感受到您此刻的情绪状态。请深呼吸，让自己平静下来。情绪如同天空中的云朵，来来去去，不必执着。接纳当下，便是疗愈的开始。',
  'parenting': `【情绪状态评估】
根据您的描述，孩子在面对这种情况时表现出明显的焦虑情绪，这可能与年龄发展阶段的特点有关。

【行为模式分析】
孩子出现这种行为，往往是在寻求关注或表达内心的不安。这种行为模式在同龄儿童中较为常见。

【初步建议】
建议您保持耐心，多与孩子沟通，理解其内心需求。建立稳定的日常作息，给予充分的安全感。

PREMIUM:
【深度心理成因解析】
从心理学角度分析，孩子的这种行为源于对分离的恐惧和对安全感的渴望。在6-12岁阶段，孩子开始建立独立的自我意识，但同时仍然依赖父母的情感支持。当这种支持不足时，孩子会通过各种行为来表达内心的焦虑。

【定制化干预方案】
1. 建立固定的亲子时间：每天至少30分钟的高质量陪伴
2. 使用积极倾听技巧：不打断、不评判，让孩子完整表达
3. 设立清晰的边界和规则：让孩子知道什么是可接受的行为
4. 引入情绪表达工具：如情绪卡片、绘画等

【分阶段行动指南】
第一周：建立信任，多倾听少说教
第二周：引入规则，温和但坚定
第三周：观察变化，调整策略
第四周：巩固成果，形成习惯

【长期成长规划】
建议定期进行亲子关系评估，关注孩子的心理发展里程碑。如问题持续，可考虑寻求专业心理咨询师的帮助。`,
  'yili': '易经云："天行健，君子以自强不息；地势坤，君子以厚德载物。"您所问之事，需顺势而为，静待时机，自有转机。',
  'gongan': '赵州禅师曾云："吃茶去。"公案不在文字，而在当下的体验。放下思虑，直指人心，方见本来面目。',
  'awakening': '觉醒始于觉察。每一个当下都是觉醒的契机。记录你的感悟，便是与内心对话。觉察之光，终将照亮前行的道路。',
  'mingli': '命理之学，源于天地自然之道。通过生辰八字，可以洞察人生轨迹，趋吉避凶。但命运掌握在自己手中，积善之家必有余庆。',
  'health': '养生之道，在于顺应自然。饮食有节，起居有常，不妄作劳。身体是承载灵魂的容器，关爱身体便是善待自己。',
  'meditation': '冥想是通往内心深处的桥梁。在宁静中，我们可以听见自己的声音，找到内心的平静。让思绪如水般流淌，不执着于一念。',
  'pastlife': `【前世溯源】
根据您的生辰八字，您的前世乃是一位深山修行的隐士。

【前世生平】
您出生于书香门第，自幼喜爱读书，却无意于功名。而立之年，您辞别家人，入深山修行，悟道参禅数十载。您心地善良，常为乡民义诊施药，深受敬重。

【前世因缘】
您前世所积福德，将在今生化作智慧与福报。您对内心平静的向往，正是前世修行习气的延续。

【今生启示】
建议您在今生继续修习正念，培养慈悲心。前世的修行根基，将助您在今生获得更大的成长。

【前世善缘】
您今生遇到的善知识，多是前世有缘之人。珍惜每一次相遇，便是延续前世善缘。`,
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

    // 检查缓存（仅对非对话模式且无 conversation_id 的请求）
    if (!conversation_id) {
      const cacheKey = generateCacheKey(type, query);
      const cachedData = cache.get(cacheKey);
      
      if (cachedData && isCacheValid(cachedData.timestamp)) {
        console.log(`[Cache] 使用缓存数据: ${cacheKey}`);
        return new Response(cachedData.data, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'public, max-age=300',
            'Connection': 'keep-alive',
          },
        });
      }
    }

    // 2. 根据 type 选择对应的 API Key
    const apiKey = API_KEY_MAP[type];

    console.log(`[Dify API] type: ${type}, apiKey exists: ${!!apiKey}`);

    // 3. 如果 API Key 未配置，返回模拟数据
    // 移除强制mock模式，让真实API Key生效
    if (!apiKey) {
      const mockConversationId = (conversation_id && typeof conversation_id === 'string' && conversation_id.trim() !== '') 
        ? conversation_id.trim() 
        : generateConversationId();
      
      const mockStream = createMockStream(type, mockConversationId);
      
      // 缓存 Mock 数据（仅对非对话模式）
      if (!conversation_id) {
        const cacheKey = generateCacheKey(type, query);
        cache.set(cacheKey, {
          data: mockStream,
          timestamp: Date.now(),
        });
        console.log(`[Cache] 缓存 Mock 数据: ${cacheKey}`);
      }
      
      return new Response(mockStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 4. 构造聊天模式的请求体对象
    const requestBody: Record<string, any> = {
      inputs: {
        ...((inputs && typeof inputs === 'object') ? inputs : {}),
      },
      query: query,
      response_mode: 'streaming',
      user: user || 'lingjingge-user',
    };

    // 如果有 conversation_id，添加到请求体
    if (conversation_id && typeof conversation_id === 'string' && conversation_id.trim() !== '') {
      requestBody.conversation_id = conversation_id.trim();
    }

    // 6. 使用 fetch 向 Dify 聊天 API 发送 POST 请求
    const difyResponse = await fetch('https://api.dify.ai/v1/chat-messages', {
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
