// ============================================================
// /api/marriage —— 婚姻家庭合婚报告生成（基础版）
// 入参：
//   {
//     self: { name, gender, birthDate, birthHour, calendarType },
//     partner: { name, gender, birthDate, birthHour, calendarType },
//     relationshipStatus: 'dating' | 'early-marriage' | 'long-marriage' | 'crisis',
//     painPoints: string[]   // ['personality' | 'inlaws' | 'wealth' | 'children' | 'private']
//   }
// 返回：{ success: true, data: MarriageReport }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkMarriageRules } from '@/lib/marriage-rules';

const PersonSchema = z.object({
  name: z.string().min(1, '姓名必填').max(20, '姓名过长'),
  gender: z.enum(['female', 'male'], { errorMap: () => ({ message: '性别应为 female 或 male' }) }),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '出生日期格式应为 YYYY-MM-DD'),
  birthHour: z.number().int().min(0).max(23),
  calendarType: z.enum(['solar', 'lunar']),
});

const InputSchema = z.object({
  self: PersonSchema,
  partner: PersonSchema,
  relationshipStatus: z.enum(['dating', 'early-marriage', 'long-marriage', 'crisis']),
  painPoints: z.array(z.enum(['personality', 'inlaws', 'wealth', 'children', 'private'])).default([]),
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

    const data = checkMarriageRules(parsed.data);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[api/marriage] failed:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'POST { self:{name,gender,birthDate,birthHour,calendarType}, partner:{...}, relationshipStatus, painPoints[] } to generate a marriage compatibility report.',
  });
}
