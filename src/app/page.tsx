'use client';

import { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import Timeline from '@/components/Timeline';

interface Recommendation {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  reasoning: string;
  suggestedActions: string[];
  relatedBranchIds: string[];
  relatedNodeIds: string[];
  createdAt: string;
}

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
  totalBranches: number;
  nodesByBranch?: { nodeCount: number }[];
  recentActivity?: string[];
}

export default function Home() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [stats, setStats] = useState<TreeStats | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [messages, setMessages] = useState<Array<{role: string, transcript: string}>>([]);
  const [assistantId, setAssistantId] = useState<string>('93287982-e8ea-4b30-8515-bf5ea783c2cf');
  const [showConfig, setShowConfig] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);

  const fetchTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tree');
      console.log('Tree response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Tree data:', data);
      
      if (data.success) {
        setTree(data.tree);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch tree');
      }
    } catch (err) {
      console.error('Error fetching tree:', err);
      setError(`Failed to fetch tree data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (type?: string, priority?: string) => {
    setLoadingRecommendations(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (priority) params.append('priority', priority);
      params.append('limit', '5');

      const response = await fetch(`/api/recommendations?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations);
      } else {
        setError(data.error || 'Failed to fetch recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(`Failed to fetch recommendations: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const startVapiCall = async () => {
    // For client-side, we need to use NEXT_PUBLIC_ prefix
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    
    if (!apiKey) {
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
      vapiRef.current = new Vapi(apiKey);

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
          // console.log(`${message.role}: ${message.transcript}`);
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
    <div className="w-screen h-screen overflow-hidden relative">
      <Timeline />
      
      {/* Floating Voice Call Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={startVapiCall}
          disabled={loading}
          className="bg-white hover:bg-gray-100 disabled:bg-gray-300 text-black font-semibold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg border border-gray-200"
        >
          🎤 Start Voice Call
        </button>
      </div>
    </div>
  );
}
