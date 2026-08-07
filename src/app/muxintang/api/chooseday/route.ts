import { NextRequest, NextResponse } from 'next/server';
import { generateChooseDayResult } from '@/lib/muxintang/bazi-engine';
import { callDifyForTool } from '@/lib/muxintang/dify-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { purpose, year, month, day } = await request.json();

    const tenantId = request.headers.get('x-tenant-id') || 'muxintang';

    // 1) 本地基于黄历的吉凶判定（快速兜底）
    const localResult = generateChooseDayResult(purpose, year, month, day);

    // 2) 真实 Dify 调用：让阿阇梨做深度解读
    //    注意：只把 localResult 摘要传 Dify，避免长 ASCII 艺术字符超过 LLM 输入限制
    const purposeNames: Record<string, string> = {
      结婚: '嫁娶',
      搬家: '入宅',
      开业: '开市',
      出差: '出行',
      动土: '动土',
      安葬: '安葬',
      求医: '求医',
      签约: '签约',
    };
    const purposeText = purposeNames[purpose] || purpose || '未指定';
    const localSummary = localResult.length > 200
      ? localResult.slice(0, 200) + '…(本地黄历完整判定已在前端展示)'
      : localResult;

    const aiInterpretation = await callDifyForTool(
      'chooseday',
      {
        purpose: purposeText,
        year,
        month,
        day,
        hasLocalResult: true,
      },
      `请为${year}年${month}月的择日活动【${purposeText}】做深度开示。\n\n【本地黄历判定摘要】\n${localSummary}\n\n请从五行宜忌、神煞方位、时辰适配三个维度补充解读，给出最终建议。`,
      `muxintang-chooseday-${year}-${month}-${purpose}-${Date.now()}`
    );

    const result = `${localResult}\n\n【阿阇梨择日心解】\n${aiInterpretation}`;

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      purpose,
      year,
      month,
      day,
      interpretation: aiInterpretation,
      result,
      // 本地黄历结果 > 200 字符时传摘要给 Dify，前端用此字段显示提示
      summarized: localResult.length > 200,
    });
  } catch (error) {
    console.error('ChooseDay API error:', error);
    return NextResponse.json(
      { success: false, error: '择日失败' },
      { status: 500 }
    );
  }
}
