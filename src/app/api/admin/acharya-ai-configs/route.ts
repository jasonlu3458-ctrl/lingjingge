export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, isAuthError } from '@/lib/admin-auth';
import { AcharyaAIConfigCreateSchema, parseRequestBody } from '@/lib/validators/api-schemas';

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

export async function POST(request: NextRequest) {
  try {
    // P0 安全加固：写入 AI 配置必须先校验 admin/acharya 身份
    const auth = await requireAdminAuth();
    if (isAuthError(auth)) return auth;

    const body = await request.json();

    // Zod 校验
    const parsed = parseRequestBody(AcharyaAIConfigCreateSchema, body);
    if (parsed instanceof NextResponse) return parsed;
    const { acharya_id, acharya_name, dify_api_key, system_prompt, knowledge_base_ids } = parsed.data;

    return NextResponse.json({
      success: true,
      config: {
        id: Date.now().toString(),
        acharya_id,
        acharya_name,
        dify_api_key,
        system_prompt,
        knowledge_base_ids: knowledge_base_ids ?? [],
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}