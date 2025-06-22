import { NextRequest, NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

// GET /api/tree/search - Search nodes by content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q');

    if (!searchTerm) {
      return NextResponse.json(
        { success: false, error: 'Search term (q) is required' },
        { status: 400 }
      );
    }

    const results = TreeService.searchNodesByContent(searchTerm);

    return NextResponse.json({
      success: true,
      searchTerm: searchTerm,
      results: results,
      count: results.length
    });
  } catch (error) {
    console.error('Error searching nodes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search nodes' },
      { status: 500 }
    );
  }
} 