import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // 硅基流动接口需要 node fetch（保留流式能力）

/**
 * POST /api/tts
 * 接收 { text: string, voice?: string, speed?: number }
 * 调用硅基流动 TTS，返回 MP3 音频流。
 *
 * 文档：https://docs.siliconflow.cn/cn/api-reference/audio/create-speech
 *  - 默认模型：FunAudioLLM/CosyVoice2-0.5B（自然中文）
 *  - 默认音色：alex（沉稳男声）
 *
 * 注意：
 *  - 单次 text 建议 <= 1000 字符（硅基流动限制）
 *  - 透传音频流，前端缓存到 localStorage
 */
export async function POST(req: Request) {
  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'SILICONFLOW_API_KEY 未配置' },
      { status: 500 },
    );
  }

  let body: { text?: string; voice?: string; speed?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: '请求体不是合法 JSON' },
      { status: 400 },
    );
  }

  const text = (body.text || '').trim();
  if (!text) {
    return NextResponse.json(
      { ok: false, error: 'text 不能为空' },
      { status: 400 },
    );
  }
  // 硅基流动限制：单次 input <= 128000 字符。安全截断到 4096
  const safeText = text.length > 4096 ? text.slice(0, 4096) : text;

  // 系统预置音色格式：`<Model>:<voice>`，例如 `FunAudioLLM/CosyVoice2-0.5B:alex`
  // 若用户只填了 `alex`，自动补全模型前缀。
  const rawVoice = body.voice || process.env.SILICONFLOW_TTS_VOICE || 'alex';
  const model = process.env.SILICONFLOW_TTS_MODEL || 'FunAudioLLM/CosyVoice2-0.5B';
  const voice = rawVoice.includes(':') ? rawVoice : `${model}:${rawVoice}`;
  const speed = typeof body.speed === 'number' ? body.speed : 1.0;

  try {
    const r = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: safeText,
        voice,
        speed,
        response_format: 'mp3',
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      return NextResponse.json(
        {
          ok: false,
          error: `硅基流动返回 ${r.status}`,
          detail: errText.slice(0, 500),
        },
        { status: r.status },
      );
    }

    // 透传音频流
    if (!r.body) {
      return NextResponse.json(
        { ok: false, error: '上游无响应体' },
        { status: 502 },
      );
    }

    return new Response(r.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'X-TTS-Voice': voice,
        'X-TTS-Length': String(safeText.length),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'TTS 调用失败' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/tts
 * 健康检查
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: Boolean(process.env.SILICONFLOW_API_KEY),
    model: process.env.SILICONFLOW_TTS_MODEL || 'FunAudioLLM/CosyVoice2-0.5B',
    voice: process.env.SILICONFLOW_TTS_VOICE || 'alex',
  });
}
