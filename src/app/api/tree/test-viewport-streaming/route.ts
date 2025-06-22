import { NextRequest, NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

export async function GET(request: NextRequest) {
  try {
    console.log('Test viewport streaming: Starting enhanced test...');

    // Clear existing data
    TreeService.getAllNodes().forEach(node => TreeService.deleteNode(node.uuid));
    TreeService.getAllBranches().forEach(branch => TreeService.deleteBranch(branch.branchId));

    // Add a main branch first
    const mainBranch = TreeService.addBranch('', 'Main Life', 'My main life timeline', '2023-01-01T00:00:00Z');
    console.log('Added main branch:', mainBranch.branchName);

    // Wait a moment, then add a node with fade-in animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    const node1 = TreeService.addNode(mainBranch.branchId, 'Started my journey with enhanced animations!', '2023-03-15T10:30:00Z');
    console.log('Added node with fade-in animation:', node1.content);

    // Wait, then add a work branch with progressive reveal
    await new Promise(resolve => setTimeout(resolve, 3000));
    const workBranch = TreeService.addBranch(mainBranch.branchId, 'Work Projects', 'All my professional work and projects', '2023-06-01T09:00:00Z');
    console.log('Added work branch with progressive reveal:', workBranch.branchName);

    // Wait, then add a node to the work branch
    await new Promise(resolve => setTimeout(resolve, 2500));
    const workNode = TreeService.addNode(workBranch.branchId, 'Launched my first major project with streaming viewport!', '2023-07-15T14:20:00Z');
    console.log('Added work node with fade-in:', workNode.content);

    // Wait, then add a personal branch
    await new Promise(resolve => setTimeout(resolve, 3000));
    const personalBranch = TreeService.addBranch(mainBranch.branchId, 'Personal Growth', 'My personal development and hobbies', '2023-08-01T00:00:00Z');
    console.log('Added personal branch with progressive reveal:', personalBranch.branchName);

    // Wait, then add a personal node
    await new Promise(resolve => setTimeout(resolve, 2500));
    const personalNode = TreeService.addNode(personalBranch.branchId, 'Started learning new skills with enhanced zoom effects!', '2023-09-10T16:45:00Z');
    console.log('Added personal node with fade-in:', personalNode.content);

    // Wait, then add another main branch node
    await new Promise(resolve => setTimeout(resolve, 3000));
    const node2 = TreeService.addNode(mainBranch.branchId, 'Reflecting on my enhanced timeline journey with smooth animations!', '2023-12-01T12:00:00Z');
    console.log('Added final node with fade-in:', node2.content);

    return NextResponse.json({
      success: true,
      message: 'Enhanced viewport streaming test completed!',
      details: {
        mainBranch: mainBranch.branchName,
        workBranch: workBranch.branchName,
        personalBranch: personalBranch.branchName,
        totalNodes: TreeService.getAllNodes().length,
        totalBranches: TreeService.getAllBranches().length,
        features: [
          'Zoom-based viewport positioning',
          'Node fade-in animations',
          'Branch progressive reveal animations',
          'Smooth viewport transitions',
          'Enhanced granularity based on content type'
        ]
      }
    });

  } catch (error) {
    console.error('Test viewport streaming error:', error);
    return NextResponse.json(
      { error: 'Failed to run enhanced viewport streaming test' },
      { status: 500 }
    );
  }
} 