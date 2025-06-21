'use client';

import { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';


interface TreeNode {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'commit' | 'branch' | 'merge';
  branchName?: string;
  parentIds: string[];
  children: TreeNode[];
  metadata?: {
    status?: 'active' | 'completed' | 'paused';
    duration?: string;
    [key: string]: any;
  };
}

interface TreeStats {
  totalNodes: number;
  branches: string[];
  activeBranches: number;
  completedBranches: number;
}

export default function Home() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [stats, setStats] = useState<TreeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [messages, setMessages] = useState<Array<{role: string, transcript: string}>>([]);
  const [assistantId, setAssistantId] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);

  const fetchTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tree');
      const data = await response.json();
      
      if (data.success) {
        setTree(data.tree);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch tree');
      }
    } catch (err) {
      setError('Failed to fetch tree data');
      console.error('Error fetching tree:', err);
    } finally {
      setLoading(false);
    }
  };

  const startVapiCall = async () => {
    if (!process.env.NEXT_PUBLIC_VAPI_API_KEY) {
      setError('VAPI API key not found. Please set NEXT_PUBLIC_VAPI_API_KEY in your environment variables.');
      return;
    }

    if (!assistantId) {
      setError('Please enter your Assistant ID first.');
      setShowConfig(true);
      return;
    }

    try {
      setIsCallActive(true);
      setTranscript('');
      setMessages([]);

      // Initialize Vapi with your public API key (following docs exactly)
      vapiRef.current = new Vapi(process.env.VAPI_API_KEY);

      // Listen for events (following docs exactly)
      vapiRef.current.on('call-start', () => {
        console.log('Call started');
        setIsCallActive(true);
      });

      vapiRef.current.on('call-end', () => {
        console.log('Call ended');
        setIsCallActive(false);
        fetchTree(); // Refresh tree data after call ends
      });

      vapiRef.current.on('message', (message) => {
        if (message.type === 'transcript') {
          console.log(`${message.role}: ${message.transcript}`);
          setMessages(prev => [...prev, { role: message.role, transcript: message.transcript }]);
          setTranscript(message.transcript);
        }
      });

      // Start voice conversation (following docs exactly)
      await vapiRef.current.start(assistantId);

    } catch (err) {
      console.error('Error starting Vapi call:', err);
      setError('Failed to start voice call');
      setIsCallActive(false);
    }
  };

  const stopVapiCall = async () => {
    if (vapiRef.current) {
      await vapiRef.current.stop();
      setIsCallActive(false);
    }
  };

  const getVapiTools = async () => {
    try {
      const response = await fetch('/api/vapi/setup');
      const data = await response.json();
      if (data.success) {
        console.log('Vapi tools configuration:', data.tools);
        console.log('Assistant configuration:', data.assistant);
        return data.tools;
      }
    } catch (err) {
      console.error('Error fetching Vapi tools:', err);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Life Tree - Git Style
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Your life as a branching timeline, controlled by voice
          </p>
          
          {/* Configuration Section */}
          <div className="mb-6">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {showConfig ? 'Hide' : 'Show'} Setup Instructions
            </button>
            
            {showConfig && (
              <div className="mt-4 bg-white rounded-lg shadow p-6 text-left max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold mb-4">Setup Instructions</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">1. Create Vapi Assistant</h4>
                    <p className="text-sm text-gray-600">
                      Go to <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600">Vapi Dashboard</a> and create a new assistant.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">2. Configure Assistant</h4>
                    <p className="text-sm text-gray-600">
                      Use these settings for your assistant:
                    </p>
                    <ul className="text-sm text-gray-600 ml-4 mt-2">
                      <li>• Name: "Life Tree Assistant"</li>
                      <li>• First Message: "Hello! I'm your life tree assistant..."</li>
                      <li>• Model: GPT-4o</li>
                      <li>• Voice: 11labs (voice ID: 21m00Tcm4TlvDq8ikWAM)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">3. Add Tools</h4>
                    <button
                      onClick={getVapiTools}
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                    >
                      Get Tools Configuration
                    </button>
                    <p className="text-sm text-gray-600 mt-1">
                      Copy the tools from the console and add them to your assistant.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">4. Set Webhook URL</h4>
                    <p className="text-sm text-gray-600">
                      Set webhook URL to: <code className="bg-gray-100 px-2 py-1 rounded">https://your-domain.com/api/webhook/vapi</code>
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">5. Enter Assistant ID</h4>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Enter your Assistant ID"
                        value={assistantId}
                        onChange={(e) => setAssistantId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => localStorage.setItem('vapi_assistant_id', assistantId)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center mb-4">
            {!isCallActive ? (
              <button
                onClick={startVapiCall}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                🎤 Start Voice Call
              </button>
            ) : (
              <button
                onClick={stopVapiCall}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                🛑 End Call
              </button>
            )}
          </div>

          {isCallActive && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              🎤 Call Active - Speak to add to your life tree!
            </div>
          )}

          {transcript && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
              <strong>Latest:</strong> {transcript}
            </div>
          )}

          {messages.length > 0 && (
            <div className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded mb-4 max-h-40 overflow-y-auto">
              <strong>Conversation:</strong>
              {messages.map((msg, index) => (
                <div key={index} className="text-sm mt-1">
                  <span className="font-semibold">{msg.role}:</span> {msg.transcript}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {stats && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Tree Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalNodes}</div>
                <div className="text-sm text-gray-600">Total Nodes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.branches.length}</div>
                <div className="text-sm text-gray-600">Branches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.activeBranches}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.completedBranches}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>
        )}

        {tree && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Life Tree (JSON)</h2>
            <div className="bg-gray-100 rounded p-4 overflow-auto max-h-96">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(tree, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}
