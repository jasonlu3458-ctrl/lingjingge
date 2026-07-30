import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { LRUCache } from '@/lib/tenant-cache';

// ============================================================
// src/middleware.ts
// 多租户识别 + 后台路由鉴权守卫
// ------------------------------------------------------------
//  P0 加固要点：
//   1. 进程内 LRU 缓存（host → 租户配置，TTL 5 分钟），避免每次请求查 Supabase
//   2. 合并两段 NextResponse.next() 调用，确保 5 个 cookie 全部生效
//   3. 删除原"if (session) {}"的无效死代码
//   4. LRU 逻辑抽到 src/lib/tenant-cache.ts，与 layout / server config 复用
// ============================================================

interface TenantConfig {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  aiPersonaPrefix: string | null;
}

const MOCK_TENANTS: Record<string, TenantConfig> = {
  'www.muxintang.com': { id: 'mock-muxintang-tenant', name: '牧心堂', logoUrl: null, primaryColor: '#8B4513', aiPersonaPrefix: '你是牧心堂的禅茶导师，说话要像沏一壶老白茶，沉稳、温暖、有洞察力。擅长八字命理、风水择日、吉祥起名等传统文化服务。回答风格儒雅稳重，充满东方智慧。' },
  'muxintang.lingjingge.com': { id: 'mock-muxintang-tenant', name: '牧心堂', logoUrl: null, primaryColor: '#8B4513', aiPersonaPrefix: '你是牧心堂的禅茶导师，说话要像沏一壶老白茶，沉稳、温暖、有洞察力。擅长八字命理、风水择日、吉祥起名等传统文化服务。回答风格儒雅稳重，充满东方智慧。' },
  'local.muxintang.com': { id: 'mock-muxintang-tenant', name: '牧心堂', logoUrl: null, primaryColor: '#8B4513', aiPersonaPrefix: '你是牧心堂的禅茶导师，说话要像沏一壶老白茶，沉稳、温暖、有洞察力。擅长八字命理、风水择日、吉祥起名等传统文化服务。回答风格儒雅稳重，充满东方智慧。' },
  'localhost:3000': { id: 'mock-default-tenant', name: '灵境阁', logoUrl: null, primaryColor: '#f59e0b', aiPersonaPrefix: '' },
  'localhost:3001': { id: 'mock-default-tenant', name: '灵境阁', logoUrl: null, primaryColor: '#f59e0b', aiPersonaPrefix: '' },
  'localhost:3002': { id: 'mock-default-tenant', name: '灵境阁', logoUrl: null, primaryColor: '#f59e0b', aiPersonaPrefix: '' },
};

const MUXINTANG_FALLBACK: TenantConfig = {
  id: 'mock-muxintang-tenant',
  name: '牧心堂',
  logoUrl: null,
  primaryColor: '#8B4513',
  aiPersonaPrefix: '你是牧心堂的禅茶导师，说话要像沏一壶老白茶，沉稳、温暖、有洞察力。擅长八字命理、风水择日、吉祥起名等传统文化服务。回答风格儒雅稳重，充满东方智慧。',
};

// 进程内 LRU：key = host，value = 解析后的租户信息（null 表示"已查过但无匹配"）
const hostTenantCache = new LRUCache<TenantConfig>();

function getMuxintangFallback(): TenantConfig {
  return MUXINTANG_FALLBACK;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 静态资源直接放行
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt')
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true';

  const host = request.headers.get('host') || '';

  // ---------- 1) 解析租户配置（带 LRU 缓存） ----------
  let tenant: TenantConfig | null = hostTenantCache.get(host) ?? null;

  if (!hostTenantCache.has(host)) {
    if (useMock) {
      tenant = MOCK_TENANTS[host] ?? null;
      if (pathname.startsWith('/muxintang') && !tenant) {
        tenant = getMuxintangFallback();
      }
      if (host.includes('muxintang') && !tenant) {
        tenant = getMuxintangFallback();
      }
    } else if (supabaseUrl && supabaseServiceKey) {
      const serviceSupabase = createServerClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        cookies: { getAll() { return []; }, setAll() { } },
      });
      const { data: tenants } = await serviceSupabase
        .from('tenants')
        .select('id, name, logo_url, primary_color, ai_persona_prefix')
        .eq('domain', host)
        .limit(1);
      if (tenants && tenants.length > 0) {
        const t = tenants[0];
        tenant = {
          id: t.id,
          name: t.name,
          logoUrl: t.logo_url,
          primaryColor: t.primary_color,
          aiPersonaPrefix: t.ai_persona_prefix,
        };
      }
      if (pathname.startsWith('/muxintang') && !tenant) {
        const { data: muxintangTenants } = await serviceSupabase
          .from('tenants')
          .select('id, name, logo_url, primary_color, ai_persona_prefix')
          .like('domain', '%muxintang%')
          .limit(1);
        if (muxintangTenants && muxintangTenants.length > 0) {
          const t = muxintangTenants[0];
          tenant = {
            id: t.id,
            name: t.name,
            logoUrl: t.logo_url,
            primaryColor: t.primary_color,
            aiPersonaPrefix: t.ai_persona_prefix,
          };
        }
      }
    }
    hostTenantCache.set(host, tenant);
  }

  // ---------- 2) 构造带 x-tenant-id 的 request headers ----------
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  if (tenant) {
    requestHeaders.set('x-tenant-id', tenant.id);
  }

  // ---------- 3) 创建 response（一次性写入所有 cookie） ----------
  const isProduction = process.env.NODE_ENV === 'production';
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (tenant) {
    const cookieOpts = {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
    };
    response.cookies.set('tenant_id', tenant.id, cookieOpts);
    response.cookies.set('tenant_name', tenant.name || '', cookieOpts);
    if (tenant.logoUrl) {
      response.cookies.set('tenant_logo_url', tenant.logoUrl, cookieOpts);
    }
    if (tenant.primaryColor) {
      response.cookies.set('tenant_primary_color', tenant.primaryColor, cookieOpts);
    }
    if (tenant.aiPersonaPrefix) {
      response.cookies.set('tenant_ai_persona_prefix', tenant.aiPersonaPrefix, cookieOpts);
    }
  }

  // ---------- 4) 后台路由鉴权（仅 /admin 路径） ----------
  if (pathname.startsWith('/admin')) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return response;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/muxintang/login', request.url));
    }

    if (useMock) {
      return response;
    }

    const { data: profile } = await supabase
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
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
