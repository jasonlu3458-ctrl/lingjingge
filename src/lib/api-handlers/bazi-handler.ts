// ============================================================
// bazi-handler.ts —— 牧心堂八字 API 处理函数（共享层）
// ------------------------------------------------------------
// 这是 /muxintang/api/bazi/route.ts 的核心业务逻辑抽出层。
//
// 设计要点：
//   1) 函数只接受 NextRequest + 必要的 deps，不耦合具体路由文件
//   2) 返回标准化 NextResponse，保证调用方零适配成本
//   3) 主站未来若新增同类 API（如 /api/lifecode-advanced），
//      可直接 import { handleBaziPost } 复用同一份逻辑
//
// 不依赖任何租户特定路径 / 组件 / 数据库，确保路由隔离。
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { calculateBazi, generateBaziResult } from '@/lib/muxintang/bazi-engine';

/**
 * 牧心堂八字测算 POST 处理函数
 * 供 /muxintang/api/bazi/route.ts 直接调用
 */
export async function handleBaziPost(request: NextRequest): Promise<NextResponse> {
  try {
    const { name, gender, year, month, day, hour } = await request.json();
    const tenantId = request.headers.get('x-tenant-id') || 'muxintang';
    const userId = request.headers.get('x-user-id') || null;

    const baziData = calculateBazi({
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour) || 0,
      gender: gender === 'male' ? '男' : '女',
    });

    // Dify 润色（异步失败时本地模板兜底）
    let aiInterpretation = '';
    try {
      const { callDifyForTool } = await import('@/lib/muxintang/dify-proxy');
      aiInterpretation = await callDifyForTool(
        'mingli',
        { name, gender, year, month, day, hour, bazi: baziData },
        `请根据以下八字数据，为【${name}】同修写一段 200 字的性格底色与人生基调解读：\n\n八字：${baziData.yearPillar} ${baziData.monthPillar} ${baziData.dayPillar} ${baziData.hourPillar}\n日主：${baziData.dayMaster}(${baziData.dayMasterElement})\n五行：${JSON.stringify(baziData.fiveElements)}\n唐密本尊：${baziData.deity}`,
        `muxintang-bazi-${name}`
      );
    } catch (e) {
      console.warn('[bazi-handler] Dify 失败，使用本地模板:', e);
      aiInterpretation = '（AI 润色暂不可用，请参考下方本地解读）';
    }

    const rawResult = generateBaziResult({
      name,
      gender: gender as 'male' | 'female',
      year,
      month,
      day,
      hour,
    });

    const result = `${rawResult}\n\n【阿阇梨心解】\n${aiInterpretation}`;

    // 异步持久化用户画像（不阻塞主响应；失败不影响）
    if (userId) {
      try {
        const { updateUserBaziProfile } = await import('@/lib/user-profile');
        const baziAny = baziData as any;
        updateUserBaziProfile(userId, {
          dayStem: baziAny.dayMaster || '',
          element: (baziAny.dayMasterElement || '木') as any,
          fiveElement: baziAny.fiveElements,
          deity: baziAny.deity,
          summary: `${baziAny.dayMasterElement || ''}日主 · ${name}`,
        }).catch(() => undefined);
      } catch {
        // 静默
      }
    }

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      bazi: baziData,
      interpretation: aiInterpretation,
      result,
    });
  } catch (error) {
    console.error('[bazi-handler] error:', error);
    return NextResponse.json(
      { success: false, error: '测算失败' },
      { status: 500 }
    );
  }
}
