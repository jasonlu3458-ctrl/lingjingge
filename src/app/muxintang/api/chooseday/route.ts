import { NextRequest, NextResponse } from 'next/server';
import { generateChooseDayResult } from '@/lib/muxintang/bazi-engine';

export async function POST(request: NextRequest) {
  try {
    const { purpose, year, month, day } = await request.json();
    
    const tenantId = request.headers.get('x-tenant-id') || 'muxintang';
    
    const result = generateChooseDayResult(purpose, year, month, day);
    
    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      result,
    });
  } catch (error) {
    console.error('ChooseDay API error:', error);
    return NextResponse.json(
      { success: false, error: '择日失败' },
      { status: 500 }
    );
  }
}
