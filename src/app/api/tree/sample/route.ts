import { NextResponse } from 'next/server';
import { TreeUtils } from '@/lib/treeUtils';

export async function POST() {
  try {
    const result = TreeUtils.generateSampleData();
    
    return NextResponse.json({
      success: true,
      message: result.message,
      count: result.count
    });
  } catch (error) {
    console.error('Sample data generation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate sample data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 