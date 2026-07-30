import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function checkCronAuth(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  return request.headers.get('authorization') === `Bearer ${expected}`;
}

export async function GET(request: NextRequest) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    message: 'Daily zen notification cron endpoint',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    message: 'Daily zen notification cron triggered',
    timestamp: new Date().toISOString(),
  });
}
