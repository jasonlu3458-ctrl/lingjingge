export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DEFAULT_TENANT_CONFIG } from '@/lib/tenant-config';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: true,
        data: {
          theme_config: DEFAULT_TENANT_CONFIG.theme_config,
          enabled_features: DEFAULT_TENANT_CONFIG.enabled_features,
          ai_persona_prefix: '',
          name: DEFAULT_TENANT_CONFIG.name,
          extra_config: {},
        },
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
        success: true,
        data: {
          theme_config: DEFAULT_TENANT_CONFIG.theme_config,
          enabled_features: DEFAULT_TENANT_CONFIG.enabled_features,
          ai_persona_prefix: '',
          name: DEFAULT_TENANT_CONFIG.name,
          extra_config: {},
        },
      });
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('theme_config, enabled_features, ai_persona_prefix, name, extra_config')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return NextResponse.json({
        success: true,
        data: {
          theme_config: DEFAULT_TENANT_CONFIG.theme_config,
          enabled_features: DEFAULT_TENANT_CONFIG.enabled_features,
          ai_persona_prefix: '',
          name: DEFAULT_TENANT_CONFIG.name,
          extra_config: {},
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        theme_config: tenant.theme_config || DEFAULT_TENANT_CONFIG.theme_config,
        enabled_features: tenant.enabled_features || DEFAULT_TENANT_CONFIG.enabled_features,
        ai_persona_prefix: tenant.ai_persona_prefix || '',
        name: tenant.name || DEFAULT_TENANT_CONFIG.name,
        extra_config: typeof tenant.extra_config === 'object' ? tenant.extra_config : {},
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: {
        theme_config: DEFAULT_TENANT_CONFIG.theme_config,
        enabled_features: DEFAULT_TENANT_CONFIG.enabled_features,
        ai_persona_prefix: '',
        name: DEFAULT_TENANT_CONFIG.name,
        extra_config: {},
      },
    });
  }
}