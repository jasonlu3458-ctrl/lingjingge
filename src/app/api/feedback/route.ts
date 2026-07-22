export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
}
