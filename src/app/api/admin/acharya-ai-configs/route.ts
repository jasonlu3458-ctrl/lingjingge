export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const mockConfigs = [
  {
    id: '1',
    acharya_id: 'acharya-001',
    acharya_name: '禅茶导师',
    dify_api_key: 'sk-xxxxxxxxxxxx',
    system_prompt: '你是一位精通禅茶文化的导师，擅长茶道、冥想、禅修指导。回答风格沉稳、温暖、有洞察力。',
    knowledge_base_ids: ['kb-001', 'kb-002'],
    created_at: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ configs: mockConfigs });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { acharya_id, acharya_name, dify_api_key, system_prompt, knowledge_base_ids } = body;

    if (!acharya_id || !acharya_name || !dify_api_key || !system_prompt) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      config: {
        id: Date.now().toString(),
        acharya_id,
        acharya_name,
        dify_api_key,
        system_prompt,
        knowledge_base_ids: knowledge_base_ids || [],
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}