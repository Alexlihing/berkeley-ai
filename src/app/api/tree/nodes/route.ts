import { NextRequest, NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

// GET /api/tree/nodes - Get all nodes or nodes by branch
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const searchTerm = searchParams.get('search');
    const limit = searchParams.get('limit');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let nodes;

    if (searchTerm) {
      nodes = TreeService.searchNodesByContent(searchTerm);
    } else if (startDate && endDate) {
      nodes = TreeService.getNodesByDateRange(startDate, endDate);
    } else if (limit) {
      nodes = TreeService.getRecentNodes(parseInt(limit));
    } else if (branchId) {
      nodes = TreeService.getNodesByBranch(branchId);
    } else {
      nodes = TreeService.getAllNodes();
    }

    return NextResponse.json({
      success: true,
      nodes: nodes,
      count: nodes.length
    });
  } catch (error) {
    console.error('Error fetching nodes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch nodes' },
      { status: 500 }
    );
  }
}

// POST /api/tree/nodes - Add a new node
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branchId, content, timestamp } = body;

    if (!branchId || !content) {
      return NextResponse.json(
        { success: false, error: 'branchId and content are required' },
        { status: 400 }
      );
    }

    const newNode = TreeService.addNode(branchId, content);
    
    // If a custom timestamp was provided, update the node
    if (timestamp) {
      TreeService.updateNode(newNode.uuid, { timeStamp: timestamp });
    }

    return NextResponse.json({
      success: true,
      message: 'Node added successfully',
      node: newNode
    });
  } catch (error) {
    console.error('Error adding node:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add node' },
      { status: 500 }
    );
  }
} 