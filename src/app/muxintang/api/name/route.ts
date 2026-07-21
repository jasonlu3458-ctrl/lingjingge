import { NextRequest, NextResponse } from 'next/server';
import { generateNameResult } from '@/lib/muxintang/bazi-engine';
import { callDifyForTool } from '@/lib/muxintang/dify-proxy';

export async function POST(request: NextRequest) {
  try {
    const { type, gender, birthDate, expectations } = await request.json();
    
    const tenantId = request.headers.get('x-tenant-id') || 'muxintang';

    const typeNames: Record<string, string> = {
      baby: '宝宝',
      personal: '成人',
      company: '公司',
      brand: '品牌',
    };

    const aiInterpretation = await callDifyForTool(
      'name',
      {
        type: typeNames[type] || type,
        gender,
        birthDate,
        expectations,
      },
      `请为【${typeNames[type] || type}起名】提供建议。性别：${gender === 'male' ? '男' : '女'}，出生日期：${birthDate || '未提供'}，期望要求：${expectations || '未提供'}。请结合五行命理、汉字寓意、音律美感三个维度，推荐5个名字并逐一解读。`,
      `muxintang-name-${type}-${gender}`
    );

    const rawResult = generateNameResult(type, gender, birthDate, expectations);
    const result = `${rawResult}\n\n【阿阇梨起名心解】\n${aiInterpretation}`;
    
    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      type,
      gender,
      birthDate,
      expectations,
      interpretation: aiInterpretation,
      result,
    });
  } catch (error) {
    console.error('Name API error:', error);
    return NextResponse.json(
      { success: false, error: '起名失败' },
      { status: 500 }
    );
  }
}
