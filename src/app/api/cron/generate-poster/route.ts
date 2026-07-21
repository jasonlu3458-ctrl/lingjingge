import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

const THEMES = [
  { theme: '今日禅机', keywords: ['静心', '觉悟', '当下', '观照'] },
  { theme: '流年运势', keywords: ['运势', '流年', '吉凶', '宜忌'] },
  { theme: '八字命理', keywords: ['八字', '命理', '五行', '格局'] },
  { theme: '风水智慧', keywords: ['风水', '布局', '气场', '纳福'] },
  { theme: '禅修冥想', keywords: ['禅修', '冥想', '入定', '觉知'] },
  { theme: '传统文化', keywords: ['经典', '传承', '智慧', '悟道'] },
];

function getTodayTheme(): { theme: string; keywords: string[] } {
  const index = new Date().getDate() % THEMES.length;
  return THEMES[index];
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id') || 'muxintang';
    const force = searchParams.get('force') === 'true';

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (!force) {
      const { data: existing } = await supabase
        .from('generated_posters')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('date', todayStr)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          success: true,
          message: '今日海报已生成',
          exists: true,
        });
      }
    }

    const todayTheme = getTodayTheme();
    const slogan = await generatePosterSlogan(todayTheme.theme, todayTheme.keywords);

    const imageBuffer = await generatePosterImage(slogan, todayTheme.theme);

    const fileName = `poster_${todayStr}_${tenantId}.png`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('posters')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('[poster] upload error:', uploadError);
      return NextResponse.json({
        success: false,
        error: '上传图片失败',
      }, { status: 500 });
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('posters')
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    const { error: insertError } = await supabase
      .from('generated_posters')
      .upsert({
        tenant_id: tenantId,
        date: todayStr,
        theme: todayTheme.theme,
        slogan,
        image_url: imageUrl,
      }, { onConflict: 'tenant_id,date' });

    if (insertError) {
      console.error('[poster] insert error:', insertError);
    }

    return NextResponse.json({
      success: true,
      theme: todayTheme.theme,
      slogan,
      imageUrl,
      date: todayStr,
    });
  } catch (error) {
    console.error('[poster] exception:', error);
    return NextResponse.json({
      success: false,
      error: '生成海报失败',
    }, { status: 500 });
  }
}

async function generatePosterSlogan(theme: string, keywords: string[]): Promise<string> {
  const apiKey = process.env.DIFY_POSTER_API_KEY || process.env.DIFY_API_KEY || process.env.NEXT_PUBLIC_DIFY_API_KEY;
  
  if (!apiKey) {
    console.warn('[poster] no Dify API key, returning mock slogan');
    return generateMockSlogan(theme);
  }

  try {
    const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');

    const prompt = `你是一位资深文案策划，擅长为传统文化道场生成简短、有感染力、适合朋友圈传播的海报文案。

主题：${theme}
关键词：${keywords.join('、')}

请生成一段不超过150字的文案，要求：
1. 开头要有金句，能够引起情感共鸣
2. 内容紧扣主题，有传统文化韵味
3. 结尾要有呼吁行动（如"点击查看"、"关注我们"等）
4. 语气温暖、平和，符合禅意风格

只输出文案本身，不加引号，不加标题。`;

    const res = await fetch(`${baseUrl}/v1/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: prompt,
        response_mode: 'blocking',
        user: 'lingjingge-poster',
      }),
    });

    if (!res.ok) {
      console.warn('[poster] Dify request failed:', res.status);
      return generateMockSlogan(theme);
    }

    const data = await res.json();
    return data?.answer?.trim() || generateMockSlogan(theme);
  } catch (e) {
    console.warn('[poster] Dify exception:', e);
    return generateMockSlogan(theme);
  }
}

function generateMockSlogan(theme: string): string {
  const slogans: Record<string, string> = {
    '今日禅机': '心若不动，风又奈何。在喧嚣中保持一份宁静，在纷扰中守护一方净土。早安，愿你今日心如止水，诸事顺遂。点击查看今日禅机，开启智慧之门。',
    '流年运势': '岁月流转，运势起伏。把握流年玄机，洞察人生方向。新的一天，愿你顺应天时，趋吉避凶。关注我们，获取专属运势指引。',
    '八字命理': '命由天定，运在人为。读懂八字密码，掌握人生航向。每个人的命运都藏着独特的智慧。点击解锁你的命理报告，开启智慧人生。',
    '风水智慧': '山环水绕，藏风聚气。好的风水布局，带来好的气场能量。愿你的居所风生水起，福气满满。关注我们，学习居家风水之道。',
    '禅修冥想': '静坐常思己过，闲谈莫论人非。在冥想中找回内心的平静，在禅修中遇见更好的自己。今日宜静心，愿你平安喜乐。',
    '传统文化': '传承千年智慧，启迪当代人生。经典中藏着无尽的智慧宝藏。让我们一起品读经典，感悟人生真谛。关注我们，共修传统文化。',
  };
  return slogans[theme] || '心之所向，牧之以道。愿你在传统文化的滋养中，找到内心的宁静与力量。';
}

async function generatePosterImage(slogan: string, theme: string): Promise<Buffer> {
  const width = 1080;
  const height = 1920;

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  const lines = wrapText(slogan, 28);

  let y = 450;
  let textElements = '';
  for (const line of lines) {
    textElements += `<text x="540" y="${y}" text-anchor="middle" fill="#C0C0C0" font-size="36" font-family="Noto Serif SC, Songti SC, serif">${escapeXml(line)}</text>`;
    y += 55;
  }

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <radialGradient id="bgGradient" cx="50%" cy="30%" r="100%" fx="50%" fy="30%">
      <stop offset="0%" stop-color="#8B4513" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="#0a0a0a"/>
  <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
  <rect x="60" y="60" width="${width - 120}" height="${height - 120}" fill="none" stroke="#D4AF37" stroke-width="2"/>
  <rect x="80" y="80" width="${width - 160}" height="${height - 160}" fill="none" stroke="#8B4513" stroke-width="1"/>
  <text x="540" y="280" text-anchor="middle" fill="#D4AF37" font-size="52" font-weight="bold" font-family="Ma Shan Zheng, STKaiti, KaiTi, serif">${escapeXml(theme)}</text>
  ${textElements}
  <text x="540" y="${height - 180}" text-anchor="middle" fill="#808080" font-size="24" font-family="Noto Serif SC, Songti SC, serif">${escapeXml(dateStr)}</text>
  <text x="540" y="${height - 120}" text-anchor="middle" fill="#D4AF37" font-size="36" font-family="Ma Shan Zheng, STKaiti, KaiTi, serif">牧心堂</text>
  <text x="540" y="${height - 70}" text-anchor="middle" fill="#808080" font-size="20" font-family="Noto Serif SC, Songti SC, serif">心之所向，牧之以道</text>
</svg>`;

  const svgBuffer = Buffer.from(svgContent);

  return sharp(svgBuffer)
    .png()
    .toBuffer();
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const chars = text.split('');
  const lines: string[] = [];
  let currentLine = '';

  for (const char of chars) {
    if (currentLine.length >= maxCharsPerLine) {
      lines.push(currentLine);
      currentLine = '';
    }
    currentLine += char;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
