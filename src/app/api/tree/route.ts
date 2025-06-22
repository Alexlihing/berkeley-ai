import { NextRequest, NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

// GET /api/tree - Get tree data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const statsOnly = TreeService.getStats();
        return NextResponse.json({ success: true, stats: statsOnly });

      case 'nodes':
        const nodes = TreeService.getAllNodes();
        return NextResponse.json({ success: true, nodes });

      case 'branches':
        const branches = TreeService.getAllBranches();
        return NextResponse.json({ success: true, branches });

      case 'search':
        const searchTerm = searchParams.get('q');
        if (!searchTerm) {
          return NextResponse.json(
            { success: false, error: 'Search term is required' },
            { status: 400 }
          );
        }
        const searchResults = TreeService.searchNodesByContent(searchTerm);
        return NextResponse.json({ success: true, results: searchResults });

      case 'recent':
        const limit = parseInt(searchParams.get('limit') || '10');
        const recentNodes = TreeService.getRecentNodes(limit);
        return NextResponse.json({ success: true, nodes: recentNodes });

      case 'by-branch':
        const branchId = searchParams.get('branchId');
        if (!branchId) {
          return NextResponse.json(
            { success: false, error: 'branchId is required' },
            { status: 400 }
          );
        }
        const branchNodes = TreeService.getNodesByBranch(branchId);
        return NextResponse.json({ success: true, nodes: branchNodes });

      case 'date-range':
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        if (!startDate || !endDate) {
          return NextResponse.json(
            { success: false, error: 'startDate and endDate are required' },
            { status: 400 }
          );
        }
        const dateRangeNodes = TreeService.getNodesByDateRange(startDate, endDate);
        return NextResponse.json({ success: true, nodes: dateRangeNodes });

      default:
        // Return the complete tree structure and stats
        const allBranches = TreeService.getAllBranches();
        const allNodes = TreeService.getAllNodes();
        const treeStats = TreeService.getStats();
        
        // Build tree structure
        const tree = {
          id: 'root',
          title: 'Life Tree',
          description: 'Your life as a branching timeline',
          timestamp: new Date().toISOString(),
          type: 'commit' as const,
          parentIds: [],
          children: allBranches.map(branch => ({
            id: branch.branchId,
            title: branch.branchName,
            description: branch.branchSummary,
            timestamp: branch.branchStart,
            type: 'branch' as const,
            branchName: branch.branchName,
            parentIds: branch.parentBranchId ? [branch.parentBranchId] : [],
            children: allNodes
              .filter(node => node.branchId === branch.branchId)
              .map(node => ({
                id: node.uuid,
                title: `Entry ${node.uuid.slice(0, 8)}`,
                description: node.content,
                timestamp: node.timeStamp,
                type: 'commit' as const,
                parentIds: [branch.branchId],
                children: [],
                metadata: {
                  status: node.isUpdating ? 'active' : 'completed'
                }
              })),
            metadata: {
              status: branch.branchEnd ? 'completed' : 'active'
            }
          }))
        };
        
        return NextResponse.json({
          success: true,
          tree,
          stats: treeStats
        });
    }
  } catch (error) {
    console.error('Error fetching tree:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tree' },
      { status: 500 }
    );
  }
}

// POST /api/tree - Add a new node or branch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'branch') {
      const { parentBranchId, branchName, branchSummary } = data;
      const newBranch = TreeService.addBranch(parentBranchId, branchName, branchSummary);
      return NextResponse.json(newBranch, { status: 201 });
    } else {
      // Default to node
      const { branchId, content } = data;
      const newNode = TreeService.addNode(branchId, content);
      return NextResponse.json(newNode, { status: 201 });
    }
  } catch (error) {
    console.error('POST /api/tree error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/tree - Update a node or branch
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, uuid, ...updates } = body;

    if (type === 'branch') {
      const updatedBranch = TreeService.updateBranch(uuid, updates);
      if (updatedBranch) {
        return NextResponse.json(updatedBranch);
      } else {
        return NextResponse.json(
          { error: 'Branch not found' },
          { status: 404 }
        );
      }
    } else {
      // Default to node
      const updatedNode = TreeService.updateNode(uuid, updates);
      if (updatedNode) {
        return NextResponse.json(updatedNode);
      } else {
        return NextResponse.json(
          { error: 'Node not found' },
          { status: 404 }
        );
      }
    }
  } catch (error) {
    console.error('PUT /api/tree error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tree - Delete a node or branch
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');
    const type = searchParams.get('type');

    if (!uuid) {
      return NextResponse.json(
        { error: 'uuid is required' },
        { status: 400 }
      );
    }

    let deleted = false;
    if (type === 'branch') {
      deleted = TreeService.deleteBranch(uuid);
    } else {
      // Default to node
      deleted = TreeService.deleteNode(uuid);
    }

    if (deleted) {
      return NextResponse.json({ message: `${type || 'Node'} deleted successfully` });
    } else {
      return NextResponse.json(
        { error: `${type || 'Node'} not found` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error processing tree action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process action' },
      { status: 500 }
    );
  }
} 