import { NextRequest, NextResponse } from 'next/server';
import { VapiService } from '@/lib/vapiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    switch (message.type) {
      case 'function-call':
        const result = VapiService.handleFunctionCall(message.functionCall);
        return NextResponse.json({ result });

      case 'transcript':
        console.log(`${message.role}: ${message.transcript}`);
        return NextResponse.json({ received: true });

      case 'status-update':
        console.log(`Call ${message.call.id}: ${message.call.status}`);
        return NextResponse.json({ received: true });

      default:
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 