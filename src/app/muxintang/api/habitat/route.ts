import { NextRequest, NextResponse } from 'next/server';
import { generateHabitatResult } from '@/lib/muxintang/bazi-engine';
import { callDifyForTool } from '@/lib/muxintang/dify-proxy';

export async function POST(request: NextRequest) {
  try {
    const { houseType, direction, layout } = await request.json();
    
    const tenantId = request.headers.get('x-tenant-id') || 'muxintang';

    const houseNames: Record<string, string> = {
      apartment: '公寓',
      villa: '别墅',
      office: '办公室',
      shop: '商铺',
    };

    const directionNames: Record<string, string> = {
      north: '坐北朝南',
      south: '坐南朝北',
      east: '坐东朝西',
      west: '坐西朝东',
      northeast: '坐东北朝西南',
      southeast: '坐东南朝西北',
      northwest: '坐西北朝东南',
      southwest: '坐西南朝东北',
    };

    const aiInterpretation = await callDifyForTool(
      'house',
      {
        houseType: houseNames[houseType] || houseType,
        direction: directionNames[direction] || direction || '未指定',
        layout,
      },
      `请为【${houseNames[houseType] || houseType}】做风水环境分析。朝向：${directionNames[direction] || direction || '未指定'}。户型描述：${layout || '未提供'}。请从玄空飞星、八宅吉凶、气场流动三个维度进行解读，给出优化建议。`,
      `muxintang-habitat-${houseType}-${direction}`
    );

    const rawResult = generateHabitatResult(houseType, direction, layout);
    const result = `【玄空风水·九星飞泊分析】\n\n${rawResult}\n\n【阿阇梨风水心解】\n${aiInterpretation}`;
    
    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      houseType,
      direction,
      layout,
      interpretation: aiInterpretation,
      result,
    });
  } catch (error) {
    console.error('Habitat API error:', error);
    return NextResponse.json(
      { success: false, error: '分析失败' },
      { status: 500 }
    );
  }
}
