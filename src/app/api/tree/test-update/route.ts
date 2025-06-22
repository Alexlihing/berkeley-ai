import { NextResponse, NextRequest } from 'next/server';
import { TreeService } from '@/lib/treeService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // If no body, fall back to simple test node (legacy behaviour)
    if (!body || Object.keys(body).length === 0) {
      const testNode = TreeService.addNode('root', `Test update at ${new Date().toISOString()}`);
      return NextResponse.json({ success: true, node: testNode });
    }

    const { type } = body;

    if (type === 'node') {
      const { branchId, content, timeStamp } = body;
      if (!branchId || !content) {
        return NextResponse.json({ success: false, error: 'branchId and content required' }, { status: 400 });
      }
      const node = TreeService.addNode(branchId, content, timeStamp);
      return NextResponse.json({ success: true, node });
    }

    if (type === 'branch') {
      const { parentBranchId, branchName, branchSummary, branchStart } = body;
      if (!branchName || !branchSummary) {
        return NextResponse.json({ success: false, error: 'branchName and branchSummary required' }, { status: 400 });
      }
      const branch = TreeService.addBranch(parentBranchId || 'root', branchName, branchSummary, branchStart);
      return NextResponse.json({ success: true, branch });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('test-update API error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
} 