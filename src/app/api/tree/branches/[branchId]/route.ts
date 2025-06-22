import { NextRequest, NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

// GET /api/tree/branches/[branchId] - Get a specific branch
export async function GET(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const { branchId } = params;
    const branch = TreeService.findBranchById(branchId);

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Get nodes for this branch
    const nodes = TreeService.getNodesByBranch(branchId);

    return NextResponse.json({
      success: true,
      branch: branch,
      nodes: nodes,
      nodeCount: nodes.length
    });
  } catch (error) {
    console.error('Error fetching branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branch' },
      { status: 500 }
    );
  }
}

// PUT /api/tree/branches/[branchId] - Update a specific branch
export async function PUT(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const { branchId } = params;
    const body = await request.json();
    const { branchName, branchSummary, branchEnd } = body;

    const updates: any = {};
    if (branchName) updates.branchName = branchName;
    if (branchSummary) updates.branchSummary = branchSummary;
    if (branchEnd) updates.branchEnd = branchEnd;

    const updatedBranch = TreeService.updateBranch(branchId, updates);

    if (!updatedBranch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Branch updated successfully',
      branch: updatedBranch
    });
  } catch (error) {
    console.error('Error updating branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update branch' },
      { status: 500 }
    );
  }
}

// DELETE /api/tree/branches/[branchId] - Delete a specific branch and all its nodes
export async function DELETE(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const { branchId } = params;
    const deleted = TreeService.deleteBranch(branchId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Branch and all its nodes deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete branch' },
      { status: 500 }
    );
  }
} 