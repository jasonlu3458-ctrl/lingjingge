// /muxintang/api/bazi/route.ts —— 极简路由入口
// 业务逻辑全部委托给 src/lib/api-handlers/bazi-handler.ts
// 这样主站未来要新增同类 API 时可直接复用同一份 handler

import { NextRequest, NextResponse } from 'next/server';
import { handleBaziPost } from '@/lib/api-handlers/bazi-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handleBaziPost(request);
}

// 保留占位以满足 Next.js 路由文件必须 export named method 的约束
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'POST { name, gender, year, month, day, hour } to generate a bazi report.',
  });
}
