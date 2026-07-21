import { NextRequest, NextResponse } from 'next/server';
import { generateNameResult } from '@/lib/muxintang/bazi-engine';

export async function POST(request: NextRequest) {
  try {
    const { petName, petType, gender, birthDate, ownerWish } = await request.json();
    
    const tenantId = request.headers.get('x-tenant-id') || 'muxintang';
    
    const result = generateNameResult(petType, gender, birthDate, ownerWish);
    
    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      result,
    });
  } catch (error) {
    console.error('Pet Naming API error:', error);
    return NextResponse.json(
      { success: false, error: '起名失败' },
      { status: 500 }
    );
  }
}
