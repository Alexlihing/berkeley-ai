import { NextRequest, NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

// GET /api/tree/nodes/[uuid] - Get a specific node
export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params;
    const node = TreeService.findNodeById(uuid);

    if (!node) {
      return NextResponse.json(
        { success: false, error: 'Node not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      node: node
    });
  } catch (error) {
    console.error('Error fetching node:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch node' },
      { status: 500 }
    );
  }
}

// PUT /api/tree/nodes/[uuid] - Update a specific node
export async function PUT(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params;
    const body = await request.json();
    const { content, isUpdating } = body;

    const updatedNode = TreeService.updateNode(uuid, { content, isUpdating });

    if (!updatedNode) {
      return NextResponse.json(
        { success: false, error: 'Node not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Node updated successfully',
      node: updatedNode
    });
  } catch (error) {
    console.error('Error updating node:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update node' },
      { status: 500 }
    );
  }
}

// DELETE /api/tree/nodes/[uuid] - Delete a specific node
export async function DELETE(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params;
    const deleted = TreeService.deleteNode(uuid);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Node not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Node deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting node:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete node' },
      { status: 500 }
    );
  }
} 