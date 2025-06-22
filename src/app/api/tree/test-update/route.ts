import { NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

export async function POST() {
  try {
    // Add a test node to trigger an update
    const testNode = TreeService.addNode('root', `Test update at ${new Date().toISOString()}`);
    
    return NextResponse.json({
      success: true,
      message: 'Test update triggered',
      node: testNode
    });
  } catch (error) {
    console.error('Test update error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to trigger test update',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 