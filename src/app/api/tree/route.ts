import { NextRequest, NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

// GET /api/tree - Get the entire tree
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = TreeService.getStats();
        return NextResponse.json(stats);

      case 'analytics':
        const analytics = TreeService.getAnalytics();
        return NextResponse.json(analytics);

      case 'timeline':
        const timeline = TreeService.getTimeline();
        return NextResponse.json(timeline);

      case 'search':
        const filters = {
          type: searchParams.getAll('type'),
          importance: searchParams.getAll('importance'),
          tags: searchParams.getAll('tags'),
          people: searchParams.getAll('people'),
          emotions: searchParams.getAll('emotions'),
          dateRange: searchParams.get('dateRange') ? JSON.parse(searchParams.get('dateRange')!) : undefined
        };
        const searchResults = TreeService.searchNodes(filters);
        return NextResponse.json(searchResults);

      default:
        const tree = TreeService.getTree();
        return NextResponse.json(tree);
    }
  } catch (error) {
    console.error('GET /api/tree error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tree - Add a new node
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentId, ...nodeData } = body;

    const newNode = TreeService.addNode(parentId || 'root', nodeData);
    return NextResponse.json(newNode, { status: 201 });
  } catch (error) {
    console.error('POST /api/tree error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/tree - Update a node
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodeId, ...updates } = body;

    const updatedNode = TreeService.updateNode(nodeId, updates);
    if (updatedNode) {
      return NextResponse.json(updatedNode);
    } else {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('PUT /api/tree error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tree - Delete a node
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');

    if (!nodeId) {
      return NextResponse.json(
        { error: 'nodeId is required' },
        { status: 400 }
      );
    }

    const deleted = TreeService.deleteNode(nodeId);
    if (deleted) {
      return NextResponse.json({ message: 'Node deleted successfully' });
    } else {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('DELETE /api/tree error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 