import { NextResponse } from 'next/server';
import { VapiService } from '@/lib/vapiService';

export async function POST() {
  try {
    // Initialize Vapi service
    VapiService.initialize();
    
    // Create the life tree assistant
    const assistant = await VapiService.createLifeTreeAssistant();
    
    return NextResponse.json({
      success: true,
      assistant: {
        id: assistant.id,
        name: assistant.name,
        message: 'Life Tree Assistant created successfully!'
      }
    });
  } catch (error) {
    console.error('Vapi setup error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create Vapi assistant',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 