import { NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

export async function POST() {
  try {
    TreeService.clearAll();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'clear failed' }, { status: 500 });
  }
} 