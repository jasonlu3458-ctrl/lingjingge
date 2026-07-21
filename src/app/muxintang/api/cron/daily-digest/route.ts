import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function checkCronAuth(req: NextRequest): { ok: boolean; reason?: string } {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return { ok: true };
  }
  const got = req.headers.get('authorization');
  if (got === `Bearer ${expected}`) return { ok: true };
  return { ok: false, reason: 'invalid cron secret' };
}

export async function GET(req: NextRequest) {
  const auth = checkCronAuth(req);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.reason ?? 'unauthorized' },
      { status: 401 },
    );
  }

  return NextResponse.json({
    sent: 0,
    failed: 0,
    mode: 'mock' as const,
    total: 0,
    skipped: 'supabase unconfigured',
  });
}