import { NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

export async function POST() {
  try {
    // Test 1: Create a test branch with specific start and end dates
    const testBranch = TreeService.addBranch(
      'root', 
      'Test Branch', 
      'A test branch for validation testing',
      '2023-01-01T00:00:00Z',
      '2023-12-31T23:59:59Z'
    );
    
    // Test 2: Create an active branch (no end date)
    const activeBranch = TreeService.addBranch(
      'root',
      'Active Branch',
      'An active branch with no end date',
      '2024-01-01T00:00:00Z'
      // branchEnd is optional and defaults to empty string
    );
    
    // Test 3: Add node using branch ID (should work)
    const nodeByBranchId = TreeService.addNode(testBranch.branchId, 'Node added using branch ID');
    
    // Test 4: Add node using branch name (should work and fallback)
    const nodeByBranchName = TreeService.addNode('Test Branch', 'Node added using branch name');
    
    // Test 5: Try to add node to non-existent branch (should still work but warn)
    const nodeByInvalidId = TreeService.addNode('non-existent-branch', 'Node added to non-existent branch');
    
    // Test 6: Get branch names
    const branchNames = TreeService.getAllBranchNames();
    const branchNamesWithIds = TreeService.getBranchNamesWithIds();
    
    return NextResponse.json({
      success: true,
      message: 'Branch validation test completed',
      testBranch: testBranch,
      activeBranch: activeBranch,
      nodeByBranchId: nodeByBranchId,
      nodeByBranchName: nodeByBranchName,
      nodeByInvalidId: nodeByInvalidId,
      branchNames: branchNames,
      branchNamesWithIds: branchNamesWithIds,
      allBranches: TreeService.getAllBranches(),
      allNodes: TreeService.getAllNodes()
    });
  } catch (error) {
    console.error('Branch validation test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test branch validation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 