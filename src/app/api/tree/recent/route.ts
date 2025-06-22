import { NextRequest, NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

// GET /api/tree/recent - Get recent nodes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    const limitNumber = limit ? parseInt(limit) : 10;
    const recentNodes = TreeService.getRecentNodes(limitNumber);

    return NextResponse.json({
      success: true,
      nodes: recentNodes,
      count: recentNodes.length,
      limit: limitNumber
    });
  } catch (error) {
    console.error('Error fetching recent nodes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent nodes' },
      { status: 500 }
    );
  }
} 