export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, isAuthError } from '@/lib/admin-auth';
import { AcharyaAIConfigUpdateSchema, parseRequestBody } from '@/lib/validators/api-schemas';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // P0 安全加固
    const auth = await requireAdminAuth();
    if (isAuthError(auth)) return auth;

    const body = await request.json();

    // Zod 校验（PUT 所有字段可选）
    const parsed = parseRequestBody(AcharyaAIConfigUpdateSchema, body);
    if (parsed instanceof NextResponse) return parsed;
    const updateData = parsed.data;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 });
    }

    // 当前为 mock 实现，仅回显校验通过的字段
    return NextResponse.json({ success: true, id: params.id, updated: updateData });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // P0 安全加固
    const auth = await requireAdminAuth();
    if (isAuthError(auth)) return auth;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}