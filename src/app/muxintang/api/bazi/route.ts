import { NextRequest, NextResponse } from 'next/server';
import { generateBaziResult, calculateBazi } from '@/lib/muxintang/bazi-engine';
import { callDifyForTool } from '@/lib/muxintang/dify-proxy';

export async function POST(request: NextRequest) {
  try {
    const { name, gender, year, month, day, hour } = await request.json();
    
    const tenantId = request.headers.get('x-tenant-id') || 'muxintang';
    
    const baziData = calculateBazi({
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour) || 0,
      gender: gender === 'male' ? '男' : '女',
    });

    const aiInterpretation = await callDifyForTool(
      'mingli',
      {
        name,
        gender,
        year,
        month,
        day,
        hour,
        bazi: baziData,
      },
      `请根据以下八字数据，为【${name}】同修写一段 200 字的性格底色与人生基调解读：\n\n八字：${baziData.yearPillar} ${baziData.monthPillar} ${baziData.dayPillar} ${baziData.hourPillar}\n日主：${baziData.dayMaster}(${baziData.dayMasterElement})\n五行：${JSON.stringify(baziData.fiveElements)}\n唐密本尊：${baziData.deity}`,
      `muxintang-bazi-${name}`
    );

    const rawResult = generateBaziResult({
      name,
      gender: gender as 'male' | 'female',
      year,
      month,
      day,
      hour,
    });

    const result = `${rawResult}\n\n【阿阇梨心解】\n${aiInterpretation}`;
    
    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      bazi: baziData,
      interpretation: aiInterpretation,
      result,
    });
  } catch (error) {
    console.error('Bazi API error:', error);
    return NextResponse.json(
      { success: false, error: '测算失败' },
      { status: 500 }
    );
  }
}
