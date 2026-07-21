import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request, { params }: { params: { productId: string } }) {
  const productId = params.productId;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 });
  }

  const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    cookies: {
      getAll() { return []; },
      setAll() { },
    },
  });

  const cookieStore = cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { data: orders, error } = await supabase
    .from('merchant_orders')
    .select('items, status')
    .eq('user_id', userId)
    .eq('status', 'paid');

  if (error) {
    console.error('查询订单失败:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }

  const hasValidOrder = orders?.some(order => {
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    return items.some((item: { id: string }) => item.id === productId);
  });

  if (!hasValidOrder) {
    return NextResponse.json({ error: '您没有该商品的下载权限' }, { status: 403 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'posters';
  const filePath = `products/${productId}.pdf`;

  try {
    const { data, error: urlError } = await supabase
      .storage
      .from(bucket)
      .createSignedUrl(filePath, 86400);

    if (urlError || !data || !data.signedUrl) {
      return NextResponse.json({ error: '生成下载链接失败' }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (err) {
    console.error('生成签名URL失败:', err);
    return NextResponse.json({ error: '生成下载链接失败' }, { status: 500 });
  }
}
