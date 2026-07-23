import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const MOCK_TENANTS: Record<string, { id: string; name: string; logoUrl: string | null; primaryColor: string; aiPersonaPrefix: string }> = {
  'www.muxintang.com': {
    id: 'mock-muxintang-tenant',
    name: '牧心堂',
    logoUrl: null,
    primaryColor: '#8B4513',
    aiPersonaPrefix: '你是牧心堂的禅茶导师，说话要像沏一壶老白茶，沉稳、温暖、有洞察力。擅长八字命理、风水择日、吉祥起名等传统文化服务。回答风格儒雅稳重，充满东方智慧。',
  },
  'muxintang.lingjingge.com': {
    id: 'mock-muxintang-tenant',
    name: '牧心堂',
    logoUrl: null,
    primaryColor: '#8B4513',
    aiPersonaPrefix: '你是牧心堂的禅茶导师，说话要像沏一壶老白茶，沉稳、温暖、有洞察力。擅长八字命理、风水择日、吉祥起名等传统文化服务。回答风格儒雅稳重，充满东方智慧。',
  },
  'local.muxintang.com': {
    id: 'mock-muxintang-tenant',
    name: '牧心堂',
    logoUrl: null,
    primaryColor: '#8B4513',
    aiPersonaPrefix: '你是牧心堂的禅茶导师，说话要像沏一壶老白茶，沉稳、温暖、有洞察力。擅长八字命理、风水择日、吉祥起名等传统文化服务。回答风格儒雅稳重，充满东方智慧。',
  },
  'localhost:3000': {
    id: 'mock-default-tenant',
    name: '灵境阁',
    logoUrl: null,
    primaryColor: '#f59e0b',
    aiPersonaPrefix: '',
  },
  'localhost:3001': {
    id: 'mock-default-tenant',
    name: '灵境阁',
    logoUrl: null,
    primaryColor: '#f59e0b',
    aiPersonaPrefix: '',
  },
  'localhost:3002': {
    id: 'mock-default-tenant',
    name: '灵境阁',
    logoUrl: null,
    primaryColor: '#f59e0b',
    aiPersonaPrefix: '',
  },
};

function getMuxintangTenantConfig() {
  return {
    id: 'mock-muxintang-tenant',
    name: '牧心堂',
    logoUrl: null,
    primaryColor: '#8B4513',
    aiPersonaPrefix: '你是牧心堂的禅茶导师，说话要像沏一壶老白茶，沉稳、温暖、有洞察力。擅长八字命理、风水择日、吉祥起名等传统文化服务。回答风格儒雅稳重，充满东方智慧。',
  };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true';

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const host = request.headers.get('host') || '';

  let tenantId: string | null = null;
  let tenantName: string | null = null;
  let tenantLogoUrl: string | null = null;
  let tenantPrimaryColor: string | null = null;
  let tenantAiPersonaPrefix: string | null = null;

  if (useMock) {
    const mockTenant = MOCK_TENANTS[host];
    if (mockTenant) {
      tenantId = mockTenant.id;
      tenantName = mockTenant.name;
      tenantLogoUrl = mockTenant.logoUrl;
      tenantPrimaryColor = mockTenant.primaryColor;
      tenantAiPersonaPrefix = mockTenant.aiPersonaPrefix;
    }

    if (pathname.startsWith('/muxintang') && !tenantId) {
      const muxintangConfig = getMuxintangTenantConfig();
      tenantId = muxintangConfig.id;
      tenantName = muxintangConfig.name;
      tenantLogoUrl = muxintangConfig.logoUrl;
      tenantPrimaryColor = muxintangConfig.primaryColor;
      tenantAiPersonaPrefix = muxintangConfig.aiPersonaPrefix;
    }

    if (host.includes('muxintang') && !tenantId) {
      const muxintangConfig = getMuxintangTenantConfig();
      tenantId = muxintangConfig.id;
      tenantName = muxintangConfig.name;
      tenantLogoUrl = muxintangConfig.logoUrl;
      tenantPrimaryColor = muxintangConfig.primaryColor;
      tenantAiPersonaPrefix = muxintangConfig.aiPersonaPrefix;
    }
  } else if (supabaseServiceKey) {
    const serviceSupabase = createServerClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        cookies: {
          getAll() { return []; },
          setAll() { },
        },
      }
    );

    const { data: tenants, error } = await serviceSupabase
      .from('tenants')
      .select('id, name, logo_url, primary_color, ai_persona_prefix')
      .eq('domain', host)
      .limit(1);

    if (!error && tenants && tenants.length > 0) {
      const tenant = tenants[0];
      tenantId = tenant.id;
      tenantName = tenant.name;
      tenantLogoUrl = tenant.logo_url;
      tenantPrimaryColor = tenant.primary_color;
      tenantAiPersonaPrefix = tenant.ai_persona_prefix;
    }

    if (pathname.startsWith('/muxintang') && !tenantId) {
      const { data: muxintangTenants } = await serviceSupabase
        .from('tenants')
        .select('id, name, logo_url, primary_color, ai_persona_prefix')
        .like('domain', '%muxintang%')
        .limit(1);

      if (muxintangTenants && muxintangTenants.length > 0) {
        const tenant = muxintangTenants[0];
        tenantId = tenant.id;
        tenantName = tenant.name;
        tenantLogoUrl = tenant.logo_url;
        tenantPrimaryColor = tenant.primary_color;
        tenantAiPersonaPrefix = tenant.ai_persona_prefix;
      }
    }
  }

  if (tenantId) {
    response.cookies.set('tenant_id', tenantId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    response.cookies.set('tenant_name', tenantName || '', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    if (tenantLogoUrl) {
      response.cookies.set('tenant_logo_url', tenantLogoUrl, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    }
    if (tenantPrimaryColor) {
      response.cookies.set('tenant_primary_color', tenantPrimaryColor, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    }
    if (tenantAiPersonaPrefix) {
      response.cookies.set('tenant_ai_persona_prefix', tenantAiPersonaPrefix, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    }
  }

  const newHeaders = new Headers(request.headers);
  newHeaders.set('x-pathname', request.nextUrl.pathname);
  if (tenantId) {
    newHeaders.set('x-tenant-id', tenantId);
  }

  response = NextResponse.next({
    request: {
      headers: newHeaders,
    },
  });

  if (tenantId) {
    response.cookies.set('tenant_id', tenantId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    response.cookies.set('tenant_name', tenantName || '', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/muxintang/login', request.url));
    }

    if (useMock) {
      return response;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role;
    if (userRole !== 'admin' && userRole !== 'acharya') {
      return NextResponse.redirect(new URL('/muxintang/me', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/:path*',
  ],
};
