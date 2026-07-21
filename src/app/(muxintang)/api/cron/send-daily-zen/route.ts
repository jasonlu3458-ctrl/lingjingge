import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Daily zen notification cron endpoint',
    timestamp: new Date().toISOString(),
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Daily zen notification cron triggered',
    timestamp: new Date().toISOString(),
  });
}
