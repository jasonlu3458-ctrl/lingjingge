// ============================================================
// src/app/api/health/route.ts
// 健康检查端点：用于平台/容器/PaaS 探活（k8s liveness、负载均衡等）
// ------------------------------------------------------------
//  - 返回 200 + { status: 'ok', timestamp }
//  - 强制 dynamic，避免被静态化
// ============================================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
