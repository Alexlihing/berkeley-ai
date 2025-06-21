import { NextRequest, NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

// GET /api/tree - Get the entire tree
export async function GET() {
  try {
    const tree = TreeService.getTree();
    const stats = TreeService.getStats();
    
    return NextResponse.json({
      success: true,
      tree,
      stats
    });
  } catch (error) {
    console.error('Error fetching tree:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tree' },
      { status: 500 }
    );
  }
}

// POST /api/tree - Add a new node
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    let result;
    switch (action) {
      case 'add_commit':
        result = TreeService.addCommit(params.branchName, {
          title: params.title,
          description: params.description,
          timestamp: params.timestamp,
          metadata: params.metadata
        });
        break;

      case 'create_branch':
        result = TreeService.createBranch(params.branchName, params.fromCommitId, {
          title: params.title,
          description: params.description,
          timestamp: params.timestamp,
          metadata: params.metadata
        });
        break;

      case 'merge_branch':
        result = TreeService.mergeBranch(params.branchName, params.targetBranch, {
          title: params.title,
          description: params.description,
          timestamp: params.timestamp,
          metadata: params.metadata
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error processing tree action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process action' },
      { status: 500 }
    );
  }
} 