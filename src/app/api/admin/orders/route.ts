import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ orders: [] });
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    const { data: purchases, error } = await supabase
      .from('report_purchases')
      .select('id, user_id, report_type, price, purchased_at')
      .order('purchased_at', { ascending: false });

    if (error) {
      return NextResponse.json({ orders: [] });
    }

    const orders = (purchases || []).map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      items: [{ name: p.report_type, price: p.price || 0, quantity: 1 }],
      total_amount: p.price || 0,
      status: 'completed' as const,
      created_at: p.purchased_at,
    }));

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ orders: [] });
  }
}