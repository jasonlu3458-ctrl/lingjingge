export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        theme_config: null,
        enabled_features: null,
        ai_persona_prefix: null,
      });
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
      return NextResponse.json({
        theme_config: null,
        enabled_features: null,
        ai_persona_prefix: null,
      });
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('theme_config, enabled_features, ai_persona_prefix, name')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return NextResponse.json({
        theme_config: null,
        enabled_features: null,
        ai_persona_prefix: null,
      });
    }

    return NextResponse.json({
      theme_config: tenant.theme_config,
      enabled_features: tenant.enabled_features,
      ai_persona_prefix: tenant.ai_persona_prefix,
      name: tenant.name,
    });
  } catch (error) {
    return NextResponse.json({
      theme_config: null,
      enabled_features: null,
      ai_persona_prefix: null,
    });
  }
}