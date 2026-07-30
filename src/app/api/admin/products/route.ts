export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { requireAdminAuth, isAuthError } from '@/lib/admin-auth';
import {
  ProductCreateSchema,
  ProductUpdateSchema,
  parseRequestBody,
} from '@/lib/validators/api-schemas';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ products: [] });
    }

    const tenantId = request.headers.get('x-tenant-id') || '';
    
    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    let query = supabase
      .from('merchant_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('[products] GET error:', error);
      return NextResponse.json({ products: [] });
    }

    return NextResponse.json({ products: products || [] });
  } catch (error) {
    console.error('[products] GET exception:', error);
    return NextResponse.json({ products: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    // P0 安全加固：商品写入必须先校验 admin/acharya 身份
    const auth = await requireAdminAuth();
    if (isAuthError(auth)) return auth;

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

    // 优先使用 auth.tenantId，避免被 x-tenant-id 请求头伪造
    const tenantId = auth.tenantId || request.headers.get('x-tenant-id') || '';

    if (!tenantId) {
      return NextResponse.json({ error: '缺少租户标识' }, { status: 400 });
    }

    const body = await request.json();

    // Zod 校验：拒绝脏数据进入数据库
    const parsed = parseRequestBody(ProductCreateSchema, body);
    if (parsed instanceof NextResponse) return parsed;
    const {
      title,
      price,
      description,
      image_url,
      category,
      product_type,
      status,
      stock_quantity,
      digital_file_url,
    } = parsed.data;

    const { data: product, error } = await supabase
      .from('merchant_products')
      .insert({
        tenant_id: tenantId,
        title,
        price,
        description: description ?? '',
        image_url: image_url ?? '',
        category,
        product_type,
        status: status ?? 'active',
        stock_quantity: stock_quantity ?? null,
        digital_file_url: digital_file_url ?? null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[products] POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('[products] POST exception:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // P0 安全加固
    const auth = await requireAdminAuth();
    if (isAuthError(auth)) return auth;

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

    const body = await request.json();

    // Zod 校验：拒绝脏数据进入数据库
    const parsed = parseRequestBody(ProductUpdateSchema, body);
    if (parsed instanceof NextResponse) return parsed;
    const { id, ...rest } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (rest.title !== undefined) updateData.title = rest.title;
    if (rest.price !== undefined) updateData.price = rest.price;
    if (rest.description !== undefined) updateData.description = rest.description;
    if (rest.image_url !== undefined) updateData.image_url = rest.image_url;
    if (rest.category !== undefined) updateData.category = rest.category;
    if (rest.product_type !== undefined) updateData.product_type = rest.product_type;
    if (rest.status !== undefined) updateData.status = rest.status;
    if (rest.stock_quantity !== undefined) updateData.stock_quantity = rest.stock_quantity;
    if (rest.digital_file_url !== undefined) updateData.digital_file_url = rest.digital_file_url;

    // 限制只能改本租户的商品
    const tenantId = auth.tenantId;
    let scopedQuery = supabase.from('merchant_products').update(updateData).eq('id', id);
    if (tenantId) {
      scopedQuery = scopedQuery.eq('tenant_id', tenantId);
    }

    const { data: product, error } = await scopedQuery.select('*').single();

    if (error) {
      console.error('[products] PUT error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('[products] PUT exception:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // P0 安全加固
    const auth = await requireAdminAuth();
    if (isAuthError(auth)) return auth;

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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少商品ID' }, { status: 400 });
    }

    // 限制只能删本租户的商品
    const tenantId = auth.tenantId;
    let scopedQuery = supabase.from('merchant_products').delete().eq('id', id);
    if (tenantId) {
      scopedQuery = scopedQuery.eq('tenant_id', tenantId);
    }

    const { error } = await scopedQuery;

    if (error) {
      console.error('[products] DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[products] DELETE exception:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
