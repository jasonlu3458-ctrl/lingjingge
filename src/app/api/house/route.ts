// ============================================================
// /api/house —— 家居环境 · 命卦与方位基础计算
// 接收：name, gender, birthYear, doorDirection, area, familyStructure
// 返回：{guaCn, goodDirections, badDirections, score, free, paid, ...}
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkHouseRules } from '@/lib/house-rules';

export const runtime = 'nodejs';

const InputSchema = z.object({
  name: z.string().min(1, '姓名必填'),
  gender: z.enum(['male', 'female']),
  birthYear: z.number().int().min(1900).max(2100),
  doorDirection: z.enum([
    'east', 'southeast', 'south', 'southwest',
    'west', 'northwest', 'north', 'northeast',
  ]),
  area: z.number().min(10).max(2000),
  familyStructure: z.enum(['single', 'couple', 'family-kids', 'three-gen', 'elderly']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      const firstErr = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || '参数错误';
      return NextResponse.json(
        { success: false, error: firstErr, details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const report = checkHouseRules(parsed.data);
    return NextResponse.json({
      success: true,
      ...report,
    });
  } catch (err) {
    console.error('[api/house] 错误:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}
