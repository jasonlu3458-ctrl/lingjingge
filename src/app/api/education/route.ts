export const dynamic = 'force-dynamic';

// ============================================================
// /api/education —— 子女学业报告生成（基础版）
// 入参：{ name, birthDate, calendarType, grade? }
// 返回：{ success: true, data: EducationReport }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkEducationRules } from '@/lib/education-rules';

const InputSchema = z.object({
  name: z.string().min(1, '姓名必填').max(20, '姓名过长'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '出生日期格式应为 YYYY-MM-DD'),
  calendarType: z.enum(['solar', 'lunar'], { errorMap: () => ({ message: '历法类型应为 solar 或 lunar' }) }),
  grade: z.string().max(10, '年级过长').optional(),
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

    const input = {
      name: parsed.data.name,
      birthDate: parsed.data.birthDate,
      calendarType: parsed.data.calendarType,
      grade: parsed.data.grade,
    };

    const data = checkEducationRules(input);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[api/education] failed:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'POST { name, birthDate:YYYY-MM-DD, calendarType:solar|lunar, grade? } to generate an education report.',
  });
}
