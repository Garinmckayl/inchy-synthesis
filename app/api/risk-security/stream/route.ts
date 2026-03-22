import { NextRequest } from 'next/server';

// Map to store active sessions (shared with the main risk-security route)
export const activeSessions = new Map();

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Session ID is required', { status: 400 });
  }

  // Create a new response stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller in the active sessions map
      activeSessions.set(sessionId, controller);

      // Send initial message
      const initialMessage = {
        type: 'research_update',
        data: {
          id: 'initial-connection',
          type: 'progress',
          status: 'running',
          title: 'Initializing analysis',
          message: 'Setting up the research environment...',
          timestamp: Date.now()
        }
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`));

      // Set up cleanup when client disconnects
      req.signal.addEventListener('abort', () => {
        activeSessions.delete(sessionId);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
