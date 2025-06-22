import { NextRequest, NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';
import { Branch, Node } from '@/types/tree';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { branches = [], nodes = [] } = body as { branches: Branch[]; nodes: Node[] };

    // Add branches first to ensure nodes can link
    for (const b of branches) {
      // Avoid duplicates
      if (!TreeService.findBranchById(b.branchId)) {
        TreeService.addBranch(
          b.parentBranchId || 'root',
          b.branchName,
          b.branchSummary,
          b.branchStart
        );
        // Force-set generated branchId to keep original (simplistic approach)
        const created = TreeService.findBranchByName(b.branchName);
        if (created) {
          created.branchId = b.branchId;
          created.branchEnd = b.branchEnd || '';
        }
      }
    }

    for (const n of nodes) {
      if (!TreeService.findNodeById(n.uuid)) {
        TreeService.addNode(n.branchId, n.content, n.timeStamp);
        const created = TreeService.findNodeById(TreeService.getAllNodes().slice(-1)[0].uuid);
        if (created) {
          created.uuid = n.uuid;
          created.isUpdating = n.isUpdating;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Import error', err);
    return NextResponse.json({ success: false, error: err.message ?? 'Import failed' }, { status: 500 });
  }
} 