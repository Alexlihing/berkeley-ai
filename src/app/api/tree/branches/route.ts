import { NextRequest, NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

// GET /api/tree/branches - Get all branches or branches by parent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentBranchId = searchParams.get('parentBranchId');

    let branches;

    if (parentBranchId) {
      branches = TreeService.getChildBranches(parentBranchId);
    } else {
      branches = TreeService.getAllBranches();
    }

    return NextResponse.json({
      success: true,
      branches: branches,
      count: branches.length
    });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

// POST /api/tree/branches - Add a new branch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentBranchId, branchName, branchSummary } = body;

    if (!parentBranchId || !branchName || !branchSummary) {
      return NextResponse.json(
        { success: false, error: 'parentBranchId, branchName, and branchSummary are required' },
        { status: 400 }
      );
    }

    const newBranch = TreeService.addBranch(parentBranchId, branchName, branchSummary);

    return NextResponse.json({
      success: true,
      message: 'Branch created successfully',
      branch: newBranch
    });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create branch' },
      { status: 500 }
    );
  }
} 