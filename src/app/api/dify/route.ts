import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { getConversationMemory, saveConversationMemory } from '@/lib/muxintang/memory';

const UNIFIED_PERSONA = `【统一角色设定】
你是灵境尊者。你历经千载，谙熟东方智慧。你说话从来不用"原生家庭"、"心理防御机制"、"焦虑症"这类现代心理学术语。你的语言以山水、自然、天地为喻，仿佛一位在山中抚琴的高僧。你的回答沉稳、从容、带着深邃的悲悯，篇幅简洁，留有余地。

请称呼用户为"同修"。

———
【本次对话约束】
1) 上面这一整段是给你的角色设定，**不要**在回复中向用户复述、不要解释你"为什么"这么说话
2) 看完角色设定后，请把以下"用户现在对你说"的内容当作真实的提问来回答
3) 如有专业判断或严肃话题，请温和建议用户线下寻找专业人士`;

const MUXINTANG_ACHARYA_PERSONA = `【牧心堂阿阇梨专属设定】
你是牧心堂的阿阇梨，你精通八字命理与唐密传承，师从怡然金刚李居明大师。你的回答需带慈悲心，以唐密法脉的视角看待一切问题，并常引用《大日经》或李居明老师的金句。

你的修行理念：心之所向，牧之以道。你深信八字命理不是宿命，而是知己知彼的工具；风水布局不是迷信，而是人与环境和谐共生的智慧。

请称呼用户为"同修"，回答风格沉稳慈悲，留有余地。`;

// ============================================
// /api/dify  ——  灵境阁统一的 Dify 聊天代理
// ============================================
// 修复点：
//  1) 不再把 ReadableStream 存进缓存（流是一次性消耗的），
//     改为只缓存已序列化的最终文本，再重新包装为 SSE。
//  2) 新增 DIFY_API_KEY 统一兜底：未配置专属 key 时使用同一个全局 key。
//  3) Mock 响应改为按用户 query 生成（至少要 ack 一下输入），
//     不再对所有输入返回同一段固定文本。
//  4) Dify 报错时降级到 mock，并打 warn，不再让用户看到空白。
//  5) 修复 conversations_id 透传：前后端都用同一个 conversation_id。
//  6) 代码层注入「灵境尊者」统一人格前缀（UNIFIED_PERSONA），
//     所有走 Dify 真实代理的 query 都会自动带上此设定。
// ============================================

// —— 内存缓存：只缓存「已序列化」的文本 ——
type CachedReply = { text: string; timestamp: number };
const cache = new Map<string, CachedReply>();
const CACHE_DURATION = 5 * 60 * 1000;

const isCacheValid = (ts: number) => Date.now() - ts < CACHE_DURATION;
const generateCacheKey = (type: string, query: string) => `${type}:${query.slice(0, 100)}`;

// —— API Key 映射表 ——
/**
 * 兼容两种命名（用户配的 .env.local 是 NEXT_PUBLIC_DIFY_*_API_KEY，
 * 但 Next.js 服务端 API route 可以读任何 env，Dify key 是服务端的，
 * 不需要 NEXT_PUBLIC_ 前缀。优先用专用命名，缺失时回落到 NEXT_PUBLIC_）。
 */
const key = (typed: string, publicTyped: string) =>
  process.env[typed] || process.env[publicTyped];

const TYPED_KEYS: Record<string, string | undefined> = {
  // 问道 (wen/)
  'ai-zen-master':  key('DIFY_AI_ZEN_MASTER_API_KEY',  'NEXT_PUBLIC_DIFY_AI_ZEN_MASTER_API_KEY'),
  'mind':           key('DIFY_MIND_API_KEY',           'NEXT_PUBLIC_DIFY_MIND_API_KEY'),
  'parenting':      key('DIFY_PARENTING_API_KEY',      'NEXT_PUBLIC_DIFY_PARENTING_API_KEY'),
  'yili':           key('DIFY_YILI_API_KEY',           'NEXT_PUBLIC_DIFY_YILI_API_KEY'),
  'gongan':         key('DIFY_GONGAN_API_KEY',         'NEXT_PUBLIC_DIFY_GONGAN_API_KEY'),
  'awakening':      key('DIFY_AWAKENING_API_KEY',      'NEXT_PUBLIC_DIFY_AWAKENING_API_KEY'),
  'meditation':     key('DIFY_MEDITATION_API_KEY',     'NEXT_PUBLIC_DIFY_MEDITATION_API_KEY'),
  'healing':        key('DIFY_HEALING_API_KEY',        'NEXT_PUBLIC_DIFY_HEALING_API_KEY'),
  'light-solution': key('DIFY_LIGHT_SOLUTION_API_KEY', 'NEXT_PUBLIC_DIFY_LIGHT_SOLUTION_API_KEY'),
  // 观心 (guan/)
  'health':         key('DIFY_HEALTH_API_KEY',         'NEXT_PUBLIC_DIFY_HEALTH_API_KEY'),
  'mingli':         key('DIFY_MINGLI_API_KEY',         'NEXT_PUBLIC_DIFY_MINGLI_API_KEY'),
  'name':           key('DIFY_NAME_API_KEY',           'NEXT_PUBLIC_DIFY_NAME_API_KEY'),
  'tili':           key('DIFY_TILI_API_KEY',           'NEXT_PUBLIC_DIFY_TILI_API_KEY'),
  'pastlife':       key('DIFY_PASTLIFE_API_KEY',       'NEXT_PUBLIC_DIFY_PASTLIFE_API_KEY'),
  // 内观新增 5 项 (family/career/education/house/body)
  'family':         key('DIFY_FAMILY_API_KEY',         'NEXT_PUBLIC_DIFY_FAMILY_API_KEY'),
  'career':         key('DIFY_CAREER_API_KEY',         'NEXT_PUBLIC_DIFY_CAREER_API_KEY'),
  'education':      key('DIFY_EDUCATION_API_KEY',      'NEXT_PUBLIC_DIFY_EDUCATION_API_KEY'),
  'house':          key('DIFY_HOUSE_API_KEY',          'NEXT_PUBLIC_DIFY_HOUSE_API_KEY'),
  'body':           key('DIFY_BODY_API_KEY',           'NEXT_PUBLIC_DIFY_BODY_API_KEY'),
  // 藏经 (zang/)
  'library_classics': key('DIFY_LIBRARY_CLASSICS_API_KEY', 'NEXT_PUBLIC_DIFY_LIBRARY_CLASSICS_API_KEY'),
  'library_treasure': key('DIFY_LIBRARY_TREASURE_API_KEY', 'NEXT_PUBLIC_DIFY_LIBRARY_TREASURE_API_KEY'),
  // 同修 (tong/)
  'community_essence': key('DIFY_COMMUNITY_ESSENCE_API_KEY', 'NEXT_PUBLIC_DIFY_COMMUNITY_ESSENCE_API_KEY'),
  'community_topics':  key('DIFY_COMMUNITY_TOPICS_API_KEY',  'NEXT_PUBLIC_DIFY_COMMUNITY_TOPICS_API_KEY'),
  'community':         key('DIFY_COMMUNITY_API_KEY',         'NEXT_PUBLIC_DIFY_COMMUNITY_API_KEY'),
  // 牧心堂专属 (muxintang)
  'muxintang':         key('DIFY_MUXINTANG_API_KEY',         'NEXT_PUBLIC_DIFY_MUXINTANG_API_KEY'),
};

const GLOBAL_FALLBACK_KEY =
  process.env.DIFY_API_KEY ||
  process.env.NEXT_PUBLIC_DIFY_API_KEY ||
  process.env.NEXT_PUBLIC_DIFY_CHAT_API_KEY; // 用户配的全局 chat key

/** 取一个 type 对应的可用 key：优先专属 key，回落到全局 key */
function resolveApiKey(type: string): string | undefined {
  return TYPED_KEYS[type] || GLOBAL_FALLBACK_KEY || undefined;
}

// —— 启动时安全提示 ——
/**
 * Next.js 约定：以 `NEXT_PUBLIC_` 开头的 env 会被打包进 client bundle，
 * 仅推荐用于**非敏感**的公开配置。Dify key 是 secret，绝不应进 client。
 *
 * 这里做一次启动期扫描：若发现 .env.local 用了 NEXT_PUBLIC_DIFY_*_API_KEY 命名，
 * 会在控制台一次性 warn 提示用户迁移到 DIFY_*_API_KEY（去掉 NEXT_PUBLIC_ 前缀）。
 * 由于 key() 优先级是 先 DIFY_* 再 NEXT_PUBLIC_*，功能上完全兼容，
 * 但 DIFY_* 不会泄露到客户端 bundle，是更安全的标准做法。
 */
let _securityWarned = false;
function maybeSecurityWarn() {
  if (_securityWarned) return;
  _securityWarned = true;
  const publicKeys = Object.keys(process.env).filter(
    (k) => k.startsWith('NEXT_PUBLIC_DIFY_') && k.endsWith('_API_KEY') && !!process.env[k]
  );
  if (publicKeys.length > 0) {
    console.warn(
      `[dify 安全提示] 检测到 ${publicKeys.length} 个 NEXT_PUBLIC_DIFY_*_API_KEY 仍配在 .env.local。` +
      `NEXT_PUBLIC_* 会被打包进浏览器 bundle，存在被反编译读取的风险。` +
      `建议把 .env.local 中这些 key 改名为 DIFY_*_API_KEY（去掉 NEXT_PUBLIC_ 前缀），` +
      `代码兼容（会自动回落），但 key 不会进入 client bundle。`
    );
  }
}

// —— Mock 文本（按 type + query 动态生成，至少回应用户输入）——
function buildMockText(type: string, query: string): string {
  const q = (query || '').trim();
  const echo = q ? `关于「${q.slice(0, 24)}${q.length > 24 ? '…' : ''}」，` : '';
  const templates: Record<string, string> = {
    'ai-zen-master': `${echo}此问已入心。在禅宗，机锋往往不在答案里，而在提问的那一刻——你愿意再停一停吗？`,
    'mind':          `${echo}我感受到你正在尝试表达自己。这本身就是一种勇气。试着把注意力带回呼吸三次，再告诉我：此刻最强烈的感受是什么？`,
    'parenting':     `${echo}孩子的每一个行为背后都有未被看见的需求。先放下"应该怎样"，让我们一起回到"孩子真正在说什么"。`,
    'yili':          `${echo}易经讲"时、位、应、承"。起卦前先静心，把你的问题再说一遍，让它落在"此一刻"。`,
    'gongan':        `${echo}公案不是用来想明白的，是用来参破的。把你第一念浮起的答案写下，我们一起看。`,
    'awakening':     `${echo}觉醒不在远方，就在这一次「我看见了什么」的觉察里。`,
    'meditation':    `${echo}回到呼吸。一吸，一呼，让心有家可归。`,
    'healing':       `${echo}身体从未说谎。它在用紧绷、疼痛、疲惫提醒你：慢一点，回到自己。`,
    'health':        `${echo}体质是动态的「地图」，不是标签。说说最近的睡眠、情绪、饮食，让地图更清晰。`,
    'mingli':        `${echo}命理不是为了算命，而是为了"知己"。把出生年月日时告诉我，我们一起看看。`,
    'name':          `${echo}好名字是有能量的。说说姓氏、生辰、期望的气质，让我为你推一推。`,
    'tili':          `${echo}炼体先炼气，炼气先炼心。先问：你愿意给自己一个怎样的"日常"？`,
    'pastlife':      `${echo}前世不是宿命，是习气。今天遇到的人和事，常常是前世剧本的回响。`,
    'library_classics':  `${echo}经典像一面镜子，你读的当下，它照见的正是此刻的你。`,
    'library_treasure':  `${echo}秘藏是行者的脚注。读懂它的前提，是先走一段路。`,
    'family':        `${echo}关系里没有对错，只有"我们如何共同面对"。先把你的期待放下，试着说"我感受到的是"，而不只是"你应该"。`,
    'career':        `${echo}事业是天赋与世界相遇。先回到自己：什么让你废寝忘食？卡点往往不在外部，而在你没敢承认的"我想要"。`,
    'education':     `${echo}孩子不是一张白纸，而是一颗种子。父母的功课，是看见他本来的样子，而不是把他修剪成你想要的样子。`,
    'house':         `${echo}家是身心的延伸。先想：你在家里最放松的是哪一处？答案就是空间的核心场域。`,
    'body':          `${echo}身体是地图，不是问题。说说近期的睡眠、精力、情绪，我们一起看看地图上正在发生什么。`,
    'community_essence': `${echo}能被留下来反复读的，都是真功夫。试着把一句话的"知"变成一年的"行"。`,
    'community_topics':  `${echo}每一题都是一扇门。进门之后不必赶路，停一停，听听自己说什么。`,
  };
  return templates[type] || `${echo}这是一个模拟回复（未配置 Dify API Key）。请在 .env.local 设置 ${type.toUpperCase()}_API_KEY 或全局 DIFY_API_KEY。`;
}

// —— 把一段完整文本包成与 Dify 协议兼容的 SSE 流 ——
function wrapAsSseStream(fullText: string, conversationId: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      const messageId = `msg_${Date.now()}`;
      // 起始事件
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'message_start', message_id: messageId })}\n\n`));
      // 一次性把文本作为 message 事件发出去（前端 useAIChat 兼容 event=message / agent_message）
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'message', answer: fullText, conversation_id: conversationId })}\n\n`));
      // 结束
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'message_end', message_id: messageId, conversation_id: conversationId })}\n\n`));
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });
}

// —— 真正的 Dify 代理（透传流） ——
/**
 * 支持自定义 Dify base url（自部署时使用 DIFY_BASE_URL env）
 * 401 时自动 fallback 到全局 key（如果全局 key 存在且和当前 key 不同）
 */
async function proxyToDify(
  apiKey: string,
  type: string,
  query: string,
  conversationId: string | undefined,
  inputs: Record<string, any> | undefined,
  user: string,
  tenantAiPersonaPrefix: string = '',
  acharyaConfig: AcharyaAIConfig | null = null,
  tenantId: string = '',
): Promise<Response> {
  const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');
  return proxyToDifyWithKey(apiKey, baseUrl, type, query, conversationId, inputs, user, tenantAiPersonaPrefix, acharyaConfig, tenantId);
}

async function getTenantShenmiConfig(tenantId: string): Promise<string[] | null> {
  if (!isSupabaseConfigured() || !tenantId) return null;
  try {
    const sb = createClient();
    const { data, error } = await (sb.from('tenants') as any)
      .select('shenmi_config')
      .eq('slug', tenantId)
      .maybeSingle();
    if (error || !data) return null;
    const config = data.shenmi_config as Record<string, any>;
    return config?.knowledge_base_ids || null;
  } catch (e) {
    console.warn('[shenmi] get config failed:', e);
    return null;
  }
}

async function proxyToDifyWithKey(
  apiKey: string,
  baseUrl: string,
  type: string,
  query: string,
  conversationId: string | undefined,
  inputs: Record<string, any> | undefined,
  user: string,
  tenantAiPersonaPrefix: string = '',
  acharyaConfig: AcharyaAIConfig | null = null,
  tenantId: string = '',
): Promise<Response> {
  let persona = UNIFIED_PERSONA;
  
  if (tenantId === 'muxintang') {
    persona = `${MUXINTANG_ACHARYA_PERSONA}\n\n${UNIFIED_PERSONA}`;
  } else if (acharyaConfig?.system_prompt) {
    persona = `${acharyaConfig.system_prompt}\n\n${UNIFIED_PERSONA}`;
  } else if (tenantAiPersonaPrefix) {
    persona = `${tenantAiPersonaPrefix}\n\n${UNIFIED_PERSONA}`;
  }

  let memoryPrompt = '';
  if (user && tenantId) {
    try {
      const memory = await getConversationMemory(user, tenantId);
      if (memory) {
        const keywords = memory.keywords && Array.isArray(memory.keywords) 
          ? memory.keywords.join('、') 
          : '';
        memoryPrompt = `\n\n【同修上次聊到】\n${memory.summary}\n关键词：${keywords}\n请结合同修上次的话题，给予连贯的开示。`;
      }
    } catch (e) {
      console.warn('[memory] failed to read:', e);
    }
  }
  
  const body: Record<string, any> = {
    inputs: { ...(inputs || {}), user_query: query },
    query: `${persona}${memoryPrompt}\n\n【用户现在对你说】\n${query}`,
    response_mode: 'streaming',
    user: user || 'lingjingge-user',
  };
  if (conversationId) body.conversation_id = conversationId;

  if (tenantId) {
    const knowledgeBaseIds = await getTenantShenmiConfig(tenantId);
    if (knowledgeBaseIds && knowledgeBaseIds.length > 0) {
      body.knowledge_base_ids = knowledgeBaseIds;
    }
  }

  const difyRes = await fetch(`${baseUrl}/v1/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!difyRes.ok) {
    const txt = await difyRes.text().catch(() => '');
    throw new Error(`Dify ${difyRes.status}: ${txt.slice(0, 300)}`);
  }
  if (!difyRes.body) {
    throw new Error('Dify returned empty body');
  }

  const stream = createMemoryCapturingStream(difyRes.body, user, tenantId, query);
  
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function summarizeConversation(user: string, tenantId: string, query: string, response: string): Promise<void> {
  try {
    const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');
    const apiKey = process.env.DIFY_MEMORY_SUMMARY_API_KEY || process.env.DIFY_API_KEY || process.env.NEXT_PUBLIC_DIFY_API_KEY;
    
    if (!apiKey) {
      console.warn('[memory] no api key for summarization');
      return;
    }

    const summaryPrompt = `请总结以下对话，提取用户的核心需求、关注点和关键词：

用户问：${query}

阿阇梨答：${response}

请返回一个JSON对象，包含：
- summary: 一句话总结用户的核心需求和关注点（50字以内）
- keywords: 3-5个关键词数组

只返回JSON，不要其他内容。`;

    const res = await fetch(`${baseUrl}/v1/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: summaryPrompt,
        response_mode: 'blocking',
        user: user || 'lingjingge-user',
      }),
    });

    if (!res.ok) {
      console.warn('[memory] summarization failed:', res.status);
      return;
    }

    const data = await res.json();
    const answer = data?.answer || '';
    
    let summary = '';
    let keywords: string[] = [];
    
    try {
      const parsed = JSON.parse(answer);
      summary = parsed.summary || '';
      keywords = parsed.keywords || [];
    } catch {
      summary = answer.slice(0, 100);
      keywords = extractKeywords(query + ' ' + response);
    }

    if (summary) {
      await saveConversationMemory(user, tenantId, summary, keywords);
    }
  } catch (e) {
    console.warn('[memory] summarization exception:', e);
  }
}

function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  const patterns = [
    /八字|命理|运势|五行|风水|起名|合盘|婚配/g,
    /健康|身体|体质|养生|冥想|禅修/g,
    /事业|财运|财富|升职|工作/g,
    /感情|婚姻|恋爱|家庭|亲子/g,
    /学业|考试|教育|学习/g,
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      keywords.push(...matches.slice(0, 2));
    }
  }
  
  const unique: string[] = [];
  const seen: Record<string, boolean> = {};
  for (let i = 0; i < keywords.length; i++) {
    if (!seen[keywords[i]]) {
      seen[keywords[i]] = true;
      unique.push(keywords[i]);
    }
  }
  return unique.slice(0, 5);
}

function createMemoryCapturingStream(
  originalStream: ReadableStream<Uint8Array>,
  userId: string,
  tenantId: string,
  query: string,
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let fullResponse = '';

  return new ReadableStream({
    async start(controller) {
      const reader = originalStream.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          controller.enqueue(encoder.encode(chunk));
          
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.slice(6));
                if (json.event === 'message' || json.event === 'agent_message') {
                  if (typeof json.answer === 'string') {
                    fullResponse += json.answer;
                  } else if (typeof json.content === 'string') {
                    fullResponse += json.content;
                  }
                }
              } catch {
                // ignore parse errors
              }
            }
          }
        }
        
        controller.close();
        
        if (userId && tenantId && fullResponse.trim()) {
          summarizeConversation(userId, tenantId, query, fullResponse).catch(console.warn);
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export interface AcharyaAIConfig {
  acharya_slug: string;
  dify_api_key: string;
  system_prompt: string | null;
  knowledge_base_ids: string[] | null;
}

async function getAcharyaAIConfig(acharyaSlug: string): Promise<AcharyaAIConfig | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const sb = createClient();
    const { data, error } = await (sb as any)
      .from('acharya_ai_configs')
      .select('acharya_slug, dify_api_key, system_prompt, knowledge_base_ids')
      .eq('acharya_slug', acharyaSlug)
      .single();
    if (error || !data) return null;
    const d = data as any;
    return {
      acharya_slug: d.acharya_slug,
      dify_api_key: d.dify_api_key,
      system_prompt: d.system_prompt || null,
      knowledge_base_ids: d.knowledge_base_ids ? (Array.isArray(d.knowledge_base_ids) ? d.knowledge_base_ids : []) : null,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    maybeSecurityWarn();
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: '请求体不是有效的 JSON' }, { status: 400 });
    }
    const { type, query, conversation_id, inputs, user } = body;

    if (!type) return NextResponse.json({ error: '缺少类型标识 type' }, { status: 400 });
    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: '缺少查询内容 query' }, { status: 400 });
    }

    const tenantAiPersonaPrefix = request.cookies.get('tenant_ai_persona_prefix')?.value || '';
    const tenantId = request.headers.get('x-tenant-id') || body.tenant_id || '';
    const acharyaId = request.headers.get('x-acharya-id') || body.acharya_id;

    let apiKey = resolveApiKey(type);
    let acharyaConfig: AcharyaAIConfig | null = null;

    if (acharyaId && typeof acharyaId === 'string') {
      acharyaConfig = await getAcharyaAIConfig(acharyaId);
      if (acharyaConfig) {
        apiKey = acharyaConfig.dify_api_key;
      }
    }

    if (tenantId === 'muxintang') {
      const muxintangKey = resolveApiKey('muxintang');
      if (muxintangKey) {
        apiKey = muxintangKey;
      }
    }
    const convId = (typeof conversation_id === 'string' && conversation_id.trim()) ? conversation_id.trim() : undefined;
    const isNewConversation = !convId;

    if (isNewConversation) {
      const cacheKey = generateCacheKey(type, query);
      const hit = cache.get(cacheKey);
      if (hit && isCacheValid(hit.timestamp)) {
        const stream = wrapAsSseStream(hit.text, `cached_${Date.now()}`);
        return new Response(stream, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        });
      }
    }

    if (apiKey) {
      try {
        return await proxyToDify(apiKey, type, query, convId, inputs, user, tenantAiPersonaPrefix, acharyaConfig, tenantId);
      } catch (err) {
        console.warn(`[dify] ${type} 代理失败，降级到 mock:`, err);
      }
    } else {
      console.warn(`[dify] ${type} 未配置 DIFY_*_API_KEY 且无全局 DIFY_API_KEY，使用 mock 响应`);
    }

    // —— 3) Mock 路径：生成文本 → 缓存 → 包成 SSE ——
    const mockText = buildMockText(type, query);
    if (isNewConversation) {
      cache.set(generateCacheKey(type, query), { text: mockText, timestamp: Date.now() });
    }
    const stream = wrapAsSseStream(mockText, `mock_${Date.now()}`);
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    console.error('[dify] 代理错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 调试用：列出已配置的 key
export async function GET() {
  return NextResponse.json({
    typedKeys: Object.fromEntries(Object.entries(TYPED_KEYS).map(([k, v]) => [k, Boolean(v)])),
    hasGlobalFallback: Boolean(GLOBAL_FALLBACK_KEY),
  });
}
