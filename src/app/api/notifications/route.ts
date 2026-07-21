import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
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
    const { userId, tenantId, subscription } = body;

    if (!userId || !subscription) {
      return NextResponse.json({ error: '缺少用户ID或订阅信息' }, { status: 400 });
    }

    const endpoint = subscription.endpoint;

    const { data: existing, error: findError } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', endpoint)
      .maybeSingle();

    if (findError) {
      console.error('[notifications] find subscription error:', findError);
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({
          user_id: userId,
          tenant_id: tenantId || '',
          subscription: JSON.stringify(subscription),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('[notifications] update subscription error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, updated: true });
    }

    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId,
        tenant_id: tenantId || '',
        endpoint,
        subscription: JSON.stringify(subscription),
      });

    if (insertError) {
      console.error('[notifications] insert subscription error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: false });
  } catch (error) {
    console.error('[notifications] POST exception:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: '缺少订阅端点' }, { status: 400 });
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) {
      console.error('[notifications] delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[notifications] DELETE exception:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ count: 0 });
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    let query = supabase.from('push_subscriptions').select('subscription');

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('[notifications] GET error:', error);
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ 
      count: subscriptions?.length || 0,
      subscriptions: subscriptions?.map((s: any) => ({
        endpoint: s.endpoint,
        user_id: s.user_id,
      })) || [],
    });
  } catch (error) {
    console.error('[notifications] GET exception:', error);
    return NextResponse.json({ count: 0 });
  }
}

async function sendNotification(subscription: PushSubscription, payload: string) {
  try {
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEB_PUSH_KEY}`,
      },
      body: payload,
    });

    if (response.status === 410) {
      console.warn('[notifications] subscription expired:', subscription.endpoint);
      return { success: false, expired: true };
    }

    if (!response.ok) {
      console.warn('[notifications] send failed:', response.status);
      return { success: false, expired: false };
    }

    return { success: true, expired: false };
  } catch (error) {
    console.warn('[notifications] send exception:', error);
    return { success: false, expired: false };
  }
}

export async function PUT(request: NextRequest) {
  try {
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
    const { title, message, tenantId } = body;

    let query = supabase.from('push_subscriptions').select('subscription');

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('[notifications] send error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let successCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions || []) {
      try {
        const subscription = JSON.parse(sub.subscription);
        const payload = JSON.stringify({
          title: title || '阿阇梨晨音',
          body: message || '',
          icon: '/favicon.ico',
          url: '/',
        });

        const result = await sendNotification(subscription as PushSubscription, payload);

        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          if (result.expired) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscription.endpoint);
          }
        }
      } catch (e) {
        console.warn('[notifications] process subscription error:', e);
        failedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent: successCount, 
      failed: failedCount,
      total: (subscriptions || []).length,
    });
  } catch (error) {
    console.error('[notifications] PUT exception:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
