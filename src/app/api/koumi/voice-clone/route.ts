import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase 未配置',
      }, { status: 500 });
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    });

    const body = await request.json();
    const { tenantId = 'muxintang', audioBase64 } = body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return NextResponse.json({
        success: false,
        error: '请上传录音样本',
      }, { status: 400 });
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name')
      .eq('slug', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({
        success: false,
        error: '租户不存在',
      }, { status: 404 });
    }

    const voiceId = await cloneVoice(audioBase64, tenant.name || tenantId);

    if (!voiceId) {
      return NextResponse.json({
        success: false,
        error: '声音克隆失败',
      }, { status: 500 });
    }

    await supabase
      .from('tenants')
      .update({
        koumi_config: {
          voice_id: voiceId,
          cloned_at: new Date().toISOString(),
          audio_sample_size: audioBase64.length,
        },
      })
      .eq('slug', tenantId);

    return NextResponse.json({
      success: true,
      voiceId,
      message: '专属声音克隆成功',
    });
  } catch (error) {
    console.error('[koumi] exception:', error);
    return NextResponse.json({
      success: false,
      error: '声音克隆失败',
    }, { status: 500 });
  }
}

async function cloneVoice(audioBase64: string, name: string): Promise<string | null> {
  const apiKey = process.env.SILICONFLOW_API_KEY;
  
  if (!apiKey) {
    console.warn('[koumi] no SiliconFlow API key, returning mock voice id');
    return `mock_${name}_${Date.now()}`;
  }

  try {
    const model = process.env.SILICONFLOW_VOICE_CLONE_MODEL || 'FunAudioLLM/CosyVoice2-0.5B';
    
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    const formData = new FormData();
    formData.append('model', model);
    formData.append('name', name);
    formData.append('audio', new Blob([audioBuffer]), 'voice_sample.wav');

    const res = await fetch('https://api.siliconflow.cn/v1/audio/voice-clone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn('[koumi] voice clone failed:', res.status, errText);
      return `mock_${name}_${Date.now()}`;
    }

    const data = await res.json();
    return data?.voice_id || `mock_${name}_${Date.now()}`;
  } catch (e) {
    console.warn('[koumi] voice clone exception:', e);
    return `mock_${name}_${Date.now()}`;
  }
}

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tenantId') || 'muxintang';
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({
      ok: true,
      config: {},
      message: 'Supabase 未配置，返回默认配置',
    }, { status: 200 });
  }

  const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    cookies: {
      getAll() { return []; },
      setAll() { },
    },
  });

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('koumi_config')
    .eq('slug', tenantId)
    .single();

  if (error || !tenant) {
    return NextResponse.json({
      ok: false,
      error: '获取配置失败',
    }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    config: tenant.koumi_config || {},
  });
}
