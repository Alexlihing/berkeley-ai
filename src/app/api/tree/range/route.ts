import { NextRequest, NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

// GET /api/tree/range - Get nodes by date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const nodes = TreeService.getNodesByDateRange(startDate, endDate);

    return NextResponse.json({
      success: true,
      startDate: startDate,
      endDate: endDate,
      nodes: nodes,
      count: nodes.length
    });
  } catch (error) {
    console.error('Error fetching nodes by date range:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch nodes by date range' },
      { status: 500 }
    );
  }
} 