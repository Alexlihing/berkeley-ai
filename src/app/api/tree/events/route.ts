import { NextRequest } from 'next/server';
import { TreeService } from '@/lib/treeService';

export async function GET(request: NextRequest) {
  console.log('SSE: New connection request');
  
  // Create a simple text response for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      console.log('SSE: Stream started');
      
      const sendData = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        console.log('SSE: Sending message:', message);
        controller.enqueue(encoder.encode(message));
      };

      // Send initial data immediately
      const allBranches = TreeService.getAllBranches();
      const allNodes = TreeService.getAllNodes();
      const treeStats = TreeService.getStats();
      
      console.log('SSE: Sending initial data');
      sendData({
        type: 'initial',
        branches: allBranches,
        nodes: allNodes,
        stats: treeStats
      });

      // Subscribe to updates
      console.log('SSE: About to subscribe to updates');
      const unsubscribe = TreeService.subscribeToUpdates((update) => {
        console.log('SSE: Received update from TreeService:', update.type);
        sendData(update);
      });
      console.log('SSE: Successfully subscribed to updates');

      // Send a connection established message
      sendData({ type: 'connected', timestamp: new Date().toISOString() });

      // Keep the connection alive with periodic heartbeats
      const heartbeat = setInterval(() => {
        console.log('SSE: Sending heartbeat');
        sendData({ type: 'heartbeat', timestamp: new Date().toISOString() });
      }, 10000); // Every 10 seconds

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        console.log('SSE: Client disconnected - cleaning up');
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });

      // Also handle any other cleanup
      const cleanup = () => {
        console.log('SSE: Cleanup called');
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      };

      // Set a timeout to prevent hanging connections
      setTimeout(() => {
        console.log('SSE: Connection timeout - cleaning up');
        cleanup();
      }, 300000); // 5 minutes
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no'
    }
  });
} 