import { NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

export async function POST() {
  try {
    // Test 1: Create a test branch with specific dates
    const testBranch = TreeService.addBranch(
      'root', 
      'Test Branch', 
      'A test branch for testing tools',
      '2023-01-01T00:00:00Z',
      '2023-12-31T23:59:59Z'
    );
    
    // Test 2: Update the branch
    const updatedBranch = TreeService.updateBranch(testBranch.branchId, {
      branchName: 'Updated Test Branch',
      branchSummary: 'An updated test branch for testing tools'
    });
    
    // Test 3: Get the branch
    const retrievedBranch = TreeService.getBranch(testBranch.branchId);
    const branchNodes = TreeService.getNodesByBranch(testBranch.branchId);
    
    return NextResponse.json({
      success: true,
      message: 'Branch tools test completed',
      originalBranch: testBranch,
      updatedBranch: updatedBranch,
      retrievedBranch: retrievedBranch,
      branchNodes: branchNodes,
      nodeCount: branchNodes.length
    });
  } catch (error) {
    console.error('Branch tools test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test branch tools',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 