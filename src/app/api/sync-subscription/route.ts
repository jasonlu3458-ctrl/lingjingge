import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Polar is not configured' }, { status: 503 })
}
