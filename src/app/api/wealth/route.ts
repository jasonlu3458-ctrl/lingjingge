export const dynamic = 'force-dynamic';

// ============================================================
// /api/wealth —— 事业财富报告生成（基础版）
// 入参：{ name, gender, birthDate, birthHour, calendarType, career }
// 返回：{ success: true, data: WealthReport }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkWealthRules } from '@/lib/wealth-rules';

const InputSchema = z.object({
  name: z.string().min(1, '姓名必填').max(20, '姓名过长'),
  gender: z.enum(['female', 'male'], { errorMap: () => ({ message: '性别只能为 female 或 male' }) }),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '出生日期格式应为 YYYY-MM-DD'),
  birthHour: z.number().int().min(0).max(23).default(12),
  calendarType: z.enum(['solar', 'lunar'], { errorMap: () => ({ message: '历法类型应为 solar 或 lunar' }) }),
  career: z.enum(['互联网', '金融', '制造', '教育', '服务业', '自由职业', '其他']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErr = Object.values(fieldErrors).flat()[0] || '参数错误';
      return NextResponse.json({ success: false, error: firstErr }, { status: 400 });
    }

    const data = checkWealthRules(parsed.data);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[api/wealth] failed:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'POST { name, gender, birthDate:YYYY-MM-DD, birthHour:0-23, calendarType:solar|lunar, career:互联网|金融|制造|教育|服务业|自由职业|其他 } to generate a wealth report.',
  });
}
