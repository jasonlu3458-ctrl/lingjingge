export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { acharya_id, acharya_name, dify_api_key, system_prompt, knowledge_base_ids } = body;

    const updateData: Record<string, unknown> = {};
    if (acharya_id !== undefined) updateData.acharya_id = acharya_id;
    if (acharya_name !== undefined) updateData.acharya_name = acharya_name;
    if (dify_api_key !== undefined) updateData.dify_api_key = dify_api_key;
    if (system_prompt !== undefined) updateData.system_prompt = system_prompt;
    if (knowledge_base_ids !== undefined) updateData.knowledge_base_ids = knowledge_base_ids;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}