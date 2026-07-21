import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_SLUGS = new Set<string>(['acharya-1', 'acharya-2']);
const RATE_BUCKET = new Map<string, number[]>();
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 3;

function checkRate(ip: string): boolean {
  const now = Date.now();
  const arr = (RATE_BUCKET.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    RATE_BUCKET.set(ip, arr);
    return false;
  }
  arr.push(now);
  RATE_BUCKET.set(ip, arr);
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRate(ip)) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', detail: '5 分钟内最多 3 次' },
      { status: 429 },
    );
  }

  let body: { creatorSlug?: unknown; name?: unknown; contact?: unknown; date?: unknown; notes?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const creatorSlug = typeof body.creatorSlug === 'string' ? body.creatorSlug.trim() : '';
  if (!creatorSlug) return NextResponse.json({ ok: false, error: 'invalid_input', detail: 'creatorSlug required' }, { status: 400 });
  if (!VALID_SLUGS.has(creatorSlug)) {
    return NextResponse.json({ ok: false, error: 'creator_not_found' }, { status: 404 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 1 || name.length > 64) {
    return NextResponse.json({ ok: false, error: 'invalid_input', detail: 'name 长度需在 1-64' }, { status: 400 });
  }

  const contact = typeof body.contact === 'string' ? body.contact.trim() : '';
  if (contact.length < 3 || contact.length > 128) {
    return NextResponse.json({ ok: false, error: 'invalid_input', detail: 'contact 长度需在 3-128' }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  console.info('[consultations] mock insert', { creatorSlug, name, contact, ip });
  return NextResponse.json(
    { ok: true, mock: true, createdAt },
    { status: 200 },
  );
}

export async function GET() {
  return Response.json({
    ok: true,
    service: 'consultations',
    validSlugs: Array.from(VALID_SLUGS),
    rateLimit: { windowMs: RATE_WINDOW_MS, max: RATE_MAX },
    timestamp: new Date().toISOString(),
  });
}