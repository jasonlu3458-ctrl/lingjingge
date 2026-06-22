import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/promotions/active?type=first_month
 * 查询当前生效的优惠配置
 *
 * 响应：{
 *   ok: true,
 *   promotions: [{ id, name, description, discount_type, discount_value, start_date, end_date, product_id, max_uses, current_uses }]
 * }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  // mock 模式：返回首月特惠 19.9 让前端 UI 跑起来
  if (!isSupabaseConfigured()) {
    if (type === 'first_month') {
      return NextResponse.json({
        ok: true,
        promotions: [
          {
            id: 'mock-first-month',
            name: '首月特惠',
            description: '新手专享：行者会员首月仅 19.9 元',
            discount_type: 'first_month',
            discount_value: 19.9,
            start_date: null,
            end_date: null,
            product_id: 'mock-monthly',
            max_uses: 1000,
            current_uses: 0,
          },
        ],
        mock: true,
      });
    }
    return NextResponse.json({ ok: true, promotions: [] });
  }

  try {
    const supabase = createClient();
    const now = new Date().toISOString();

    let query = supabase
      .from('promotion_configs')
      .select('*')
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('discount_value', { ascending: true });

    if (type) {
      query = query.eq('discount_type', type);
    }

    const { data, error } = await query;
    if (error) {
      if (
        error.code === '42P01' ||
        /does not exist/i.test(error.message) ||
        /schema cache/i.test(error.message) ||
        /not found/i.test(error.message)
      ) {
        // 表未创建 → mock 一个首月特惠
        if (type === 'first_month') {
          return NextResponse.json({
            ok: true,
            promotions: [
              {
                id: 'mock-first-month',
                name: '首月特惠',
                description: '新手专享：行者会员首月仅 19.9 元',
                discount_type: 'first_month',
                discount_value: 19.9,
                start_date: null,
                end_date: null,
                product_id: 'mock-monthly',
                max_uses: 1000,
                current_uses: 0,
              },
            ],
            mock: true,
          });
        }
        return NextResponse.json({ ok: true, promotions: [], mock: true });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, promotions: data || [] });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || '查询失败' },
      { status: 500 }
    );
  }
}
