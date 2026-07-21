import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface MeSummary {
  latestAnnotation: {
    id: string;
    chapterSlug: string;
    paragraphIdx: number;
    selectedText: string;
    note: string;
    authorName: string;
    createdAt: string;
  } | null;
  latestOrder: {
    id: string;
    productType: 'scroll' | 'bracelet' | 'sachet';
    recipient: string;
    blessingMessage: string | null;
    status: 'pending' | 'blessed' | 'shipped' | 'completed' | 'cancelled';
    createdAt: string;
  } | null;
  memorySnapshot: unknown | null;
  annotationCount: number;
  orderCount: number;
}

const EMPTY: MeSummary = {
  latestAnnotation: null,
  latestOrder: null,
  memorySnapshot: null,
  annotationCount: 0,
  orderCount: 0,
};

export async function GET() {
  return NextResponse.json(EMPTY);
}