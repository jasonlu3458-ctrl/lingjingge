import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StatsResponse {
  ok: true;
  paywallCount: number;
  aiCount: number;
  pdfCount: number;
  mock: boolean;
  reason?: 'unconfigured' | 'unauthenticated' | 'unauthorized' | 'db_error';
  generatedAt: string;
}

const MOCK_STATS: Pick<StatsResponse, 'paywallCount' | 'aiCount' | 'pdfCount'> = {
  paywallCount: 23,
  aiCount: 47,
  pdfCount: 12,
};

function mockResponse(reason: StatsResponse['reason']): StatsResponse {
  return {
    ok: true,
    ...MOCK_STATS,
    mock: true,
    reason,
    generatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  return NextResponse.json(mockResponse('unconfigured'));
}