import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = new Set(['积功累德', '感悟', '问答', '分享']);
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

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  if (!checkRate(ip)) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', message: '请稍候再发' },
      { status: 429 },
    );
  }

  let raw: { title?: unknown; category?: unknown; body?: unknown; authorName?: unknown };
  try {
    raw = (await req.json()) as typeof raw;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400 },
    );
  }

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const category = typeof raw.category === 'string' ? raw.category.trim() : '';
  const body = typeof raw.body === 'string' ? raw.body.trim() : '';
  const authorName = typeof raw.authorName === 'string' ? raw.authorName.trim() : '';

  if (!body) {
    return NextResponse.json(
      { ok: false, error: 'invalid_input', detail: '正文不能为空' },
      { status: 400 },
    );
  }
  if (body.length > 2000) {
    return NextResponse.json(
      { ok: false, error: 'invalid_input', detail: '正文不能超过 2000 字' },
      { status: 400 },
    );
  }
  if (title.length > 80) {
    return NextResponse.json(
      { ok: false, error: 'invalid_input', detail: '标题不能超过 80 字' },
      { status: 400 },
    );
  }
  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_input', detail: '分类必须在 积功累德/感悟/问答/分享 中' },
      { status: 400 },
    );
  }
  if (authorName.length > 32) {
    return NextResponse.json(
      { ok: false, error: 'invalid_input', detail: '署名不能超过 32 字' },
      { status: 400 },
    );
  }

  const mockPost = {
    id: `mock-study-${Date.now()}`,
    author_name: authorName || '缘主',
    title: title || null,
    category,
    body,
    like_count: 0,
    comment_count: 0,
    created_at: new Date().toISOString(),
  };
  return NextResponse.json({ ok: true, mock: true, post: mockPost });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'study-posts',
    validCategories: Array.from(VALID_CATEGORIES),
    rateLimit: { windowMs: RATE_WINDOW_MS, max: RATE_MAX },
    timestamp: new Date().toISOString(),
  });
}