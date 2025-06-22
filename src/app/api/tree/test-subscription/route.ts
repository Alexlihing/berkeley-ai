import { NextResponse } from 'next/server';
import { TreeService } from '@/lib/treeService';

export async function GET() {
  try {
    // Test the subscription mechanism directly
    let receivedUpdate = false;
    let updateData = null;
    
    const unsubscribe = TreeService.subscribeToUpdates((update) => {
      console.log('Test: Received update:', update.type);
      receivedUpdate = true;
      updateData = update;
    });
    
    // Wait a moment, then trigger an update
    setTimeout(() => {
      console.log('Test: Triggering test update');
      TreeService.addNode('root', `Test subscription at ${new Date().toISOString()}`);
      unsubscribe();
    }, 100);
    
    return NextResponse.json({
      success: true,
      message: 'Subscription test initiated',
      receivedUpdate,
      updateData
    });
  } catch (error) {
    console.error('Subscription test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 