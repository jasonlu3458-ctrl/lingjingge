import { NextRequest, NextResponse } from 'next/server';
import { generateTrendResult } from '@/lib/muxintang/bazi-engine';
import { callDifyForTool } from '@/lib/muxintang/dify-proxy';

export async function POST(request: NextRequest) {
  try {
    const { year, month } = await request.json();
    
    const tenantId = request.headers.get('x-tenant-id') || 'muxintang';

    const zodiac = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    const yearZodiac = zodiac[(parseInt(year) - 4) % 12];

    const aiInterpretation = await callDifyForTool(
      'career',
      {
        year,
        month,
        yearZodiac,
      },
      `请为${year}年（${yearZodiac}年）${month ? month + '月' : ''}做运势分析。请从事业、财运、感情、健康四个维度进行解读，结合流年五行能量变化，给出修行与生活建议。`,
      `muxintang-trend-${year}-${month}`
    );

    const rawResult = generateTrendResult(year, month);
    const result = `${rawResult}\n\n【阿阇梨运势心解】\n${aiInterpretation}`;
    
    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      year,
      month,
      yearZodiac,
      interpretation: aiInterpretation,
      result,
    });
  } catch (error) {
    console.error('Trend API error:', error);
    return NextResponse.json(
      { success: false, error: '测算失败' },
      { status: 500 }
    );
  }
}
