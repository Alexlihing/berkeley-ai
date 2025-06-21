import { NextRequest, NextResponse } from 'next/server';
import { VapiService } from '@/lib/vapiService';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    switch (message.type) {
      case 'status-update':
        console.log(`Call ${message.call.id}: ${message.call.status}`);
        break;
        
      case 'transcript':
        console.log(`${message.role}: ${message.transcript}`);
        break;
        
      case 'function-call':
        return handleFunctionCall(message);
        
      default:
        console.log('Received message:', message);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Vapi webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function handleFunctionCall(message: any) {
  const { functionCall } = message;
  
  try {
    const result = VapiService.handleFunctionCall(functionCall);
    
    return NextResponse.json({
      type: 'function-call-result',
      functionCallResult: {
        callId: functionCall.callId,
        result: result
      }
    });
  } catch (error) {
    console.error('Function call error:', error);
    return NextResponse.json({
      type: 'function-call-result',
      functionCallResult: {
        callId: functionCall.callId,
        error: 'Function call failed'
      }
    });
  }
} 