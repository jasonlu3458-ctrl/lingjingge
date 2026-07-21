import { NextRequest, NextResponse } from 'next/server';
import { generateMatchResult } from '@/lib/muxintang/bazi-engine';
import { callDifyForTool } from '@/lib/muxintang/dify-proxy';

export async function POST(request: NextRequest) {
  try {
    const { person1Name, person1Gender, person1BirthDate, person2Name, person2Gender, person2BirthDate } = await request.json();
    
    const tenantId = request.headers.get('x-tenant-id') || 'muxintang';

    const matchScore = Math.floor(Math.random() * 30) + 70;
    const matchLevel = matchScore >= 90 ? '上上婚' : matchScore >= 80 ? '上婚' : '中婚';

    const aiInterpretation = await callDifyForTool(
      'family',
      {
        person1Name,
        person1Gender,
        person1BirthDate,
        person2Name,
        person2Gender,
        person2BirthDate,
        matchScore,
        matchLevel,
      },
      `请为【${person1Name}】与【${person2Name}】做合婚分析。匹配度：${matchScore}分，婚配等级：${matchLevel}。请从五行互补、性格契合、缘分深浅三个维度进行解读，给出相处建议。`,
      `muxintang-match-${person1Name}-${person2Name}`
    );

    const rawResult = generateMatchResult(person1Name, person1Gender, person1BirthDate, person2Name, person2Gender, person2BirthDate);
    const result = `${rawResult}\n\n【阿阇梨合婚心解】\n${aiInterpretation}`;
    
    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      matchScore,
      matchLevel,
      interpretation: aiInterpretation,
      result,
    });
  } catch (error) {
    console.error('Match API error:', error);
    return NextResponse.json(
      { success: false, error: '测算失败' },
      { status: 500 }
    );
  }
}
