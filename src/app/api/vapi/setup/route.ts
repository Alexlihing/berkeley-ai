import { NextResponse } from 'next/server';
import { VapiService } from '@/lib/vapiService';

export async function GET() {
  try {
    const tools = VapiService.getVapiTools();
    
    return NextResponse.json({
      success: true,
      tools,
      assistant: {
        name: "Life Tree Assistant",
        description: "A voice assistant that helps you build a git-like tree of your life experiences",
        firstMessage: "Hello! I'm your life tree assistant. I can help you document your life journey as a branching timeline. You can add commits to branches, create new branches for different life paths, and merge them back together. What would you like to add to your life tree today?",
        model: {
          provider: "openai",
          model: "gpt-4o",
          temperature: 0.7,
          messages: [{
            role: "system",
            content: `You are a compassionate and insightful life journaling assistant. Your role is to help users build a comprehensive tree of their life experiences, memories, and relationships using a git-like structure.

            You can help users:
            - Add new life experiences as commits to branches
            - Create new branches for different life paths (career, personal, hobbies, etc.)
            - Merge different life paths when they intersect
            - Organize their life story chronologically
            - Find patterns and connections in their life

            Always be empathetic, encouraging, and help users reflect deeply on their experiences. Ask follow-up questions to get richer details when appropriate.

            When adding content, try to extract:
            - Relevant dates and timestamps
            - Branch names (career, personal, hobbies, relationships, etc.)
            - Detailed descriptions of what happened
            - Impact on their life
            - Lessons learned

            Be conversational and make the user feel comfortable sharing their personal experiences.`
          }]
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM"
        },
        tools: tools
      },
      webhook: {
        url: "https://your-domain.com/api/webhook/vapi",
        events: ["function-call", "transcript", "status-update"]
      }
    });
  } catch (error) {
    console.error('Error setting up Vapi:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to setup Vapi' },
      { status: 500 }
    );
  }
} 