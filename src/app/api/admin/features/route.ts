import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ extra_config: {} });
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    const cookieStore = cookies();
    const tenantId = cookieStore.get('tenant_id')?.value;

    if (!tenantId) {
      return NextResponse.json({ extra_config: {} });
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('extra_config')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ extra_config: {} });
    }

    return NextResponse.json({
      extra_config: tenant.extra_config || {},
    });
  } catch (error) {
    return NextResponse.json({ extra_config: {} });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: 'Supabase config missing' }, { status: 500 });
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    const cookieStore = cookies();
    const tenantId = cookieStore.get('tenant_id')?.value;

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID not found' }, { status: 400 });
    }

    const body = await request.json();
    const { extra_config } = body;

    if (!extra_config || typeof extra_config !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid config' }, { status: 400 });
    }

    const { error } = await supabase
      .from('tenants')
      .update({ extra_config })
      .eq('id', tenantId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
