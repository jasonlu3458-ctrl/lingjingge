import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProductType = 'scroll' | 'bracelet' | 'sachet';
const VALID_PRODUCTS: ProductType[] = ['scroll', 'bracelet', 'sachet'];

type OrderStatus = 'pending' | 'blessing' | 'blessed' | 'shipped' | 'completed' | 'cancelled';
const VALID_STATUSES: OrderStatus[] = ['pending', 'blessing', 'blessed', 'shipped', 'completed', 'cancelled'];

export async function POST(req: NextRequest) {
  let body: { product_type?: unknown; recipient?: unknown; address?: unknown; blessing_message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体必须为 JSON' }, { status: 400 });
  }

  const productType = body.product_type as ProductType;
  if (!VALID_PRODUCTS.includes(productType)) {
    return NextResponse.json({ error: '请奉品类无效' }, { status: 400 });
  }
  const recipient = typeof body.recipient === 'string' ? body.recipient.trim() : '';
  if (!recipient || recipient.length > 30) {
    return NextResponse.json({ error: '收件人姓名无效（1-30 字）' }, { status: 400 });
  }
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  if (!address || address.length > 200) {
    return NextResponse.json({ error: '收件地址无效（1-200 字）' }, { status: 400 });
  }

  console.log('[api/auspicious/order] mock mode: order recorded (not persisted)');
  return NextResponse.json({
    ok: true,
    id: `mock_${Date.now()}`,
    mock: true,
  });
}

export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: '缺少订单 id' }, { status: 400 });
  }

  let body: { status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体必须为 JSON' }, { status: 400 });
  }

  const status = body.status as OrderStatus;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: '订单状态无效' }, { status: 400 });
  }

  console.log(`[api/auspicious/order] mock mode: order ${id} status → ${status}`);
  return NextResponse.json({ ok: true, id, status, mock: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'auspicious-order',
    supabase: false,
    timestamp: new Date().toISOString(),
  });
}