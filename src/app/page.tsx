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

// Add interfaces for Node and Branch from the API
interface Node {
  uuid: string;
  branchId: string;
  timeStamp: string;
  content: string;
  isUpdating: boolean;
}

interface Branch {
  parentBranchId: string;
  branchId: string;
  branchStart: string;
  branchEnd: string;
  branchName: string;
  branchSummary: string;
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

  // Add new state for nodes and branches
  const [nodes, setNodes] = useState<Node[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'nodes' | 'branches'>('tree');

  // SSE connection ref
  const eventSourceRef = useRef<EventSource | null>(null);

  // New state for spacebar hold
  const [isHoldingSpace, setIsHoldingSpace] = useState(false);
  const spaceHoldTimeout = useRef<NodeJS.Timeout | null>(null);

  // Pulse animation trigger when call toggles
  const [pulseType, setPulseType] = useState<'start' | 'stop' | null>(null);
  const prevCallActive = useRef<boolean>(isCallActive);

  // Initialize SSE connection
  const initializeSSE = () => {
    console.log('SSE: initializeSSE called, current ref:', eventSourceRef.current);
    
    if (eventSourceRef.current) {
      console.log('SSE: Closing existing connection');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    console.log('SSE: Initializing new connection...');
    const eventSource = new EventSource('/api/tree/events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE: Connection opened successfully');
    };

    eventSource.onmessage = (event) => {
      try {
        console.log('SSE: Raw message received:', event.data);
        const data = JSON.parse(event.data);
        console.log('SSE: Parsed data:', data);

        if (data.type === 'initial') {
          // Initial data load
          console.log('SSE: Loading initial data');
          setNodes(data.nodes);
          setBranches(data.branches);
        setStats(data.stats);
          setLoadingNodes(false);
          setLoadingBranches(false);
          
          // Build initial tree structure
          const initialTree = buildTreeStructure(data.branches, data.nodes);
          setTree(initialTree);
        } else if (data.type === 'connected') {
          // Connection established
          console.log('SSE: Connection confirmed:', data.timestamp);
        } else if (data.type === 'heartbeat') {
          // Heartbeat message - just log it
          console.log('SSE: Heartbeat received:', data.timestamp);
      } else {
          // Real-time updates
          console.log('SSE: Processing update:', data.type);
          setNodes(data.allNodes);
          setBranches(data.allBranches);
          setStats(data.stats);
          
          // Update tree structure
          const updatedTree = buildTreeStructure(data.allBranches, data.allNodes);
          setTree(updatedTree);
        }
      } catch (error) {
        console.error('SSE: Error parsing data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE: Connection error:', error);
      console.log('SSE: EventSource readyState:', eventSource.readyState);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (eventSourceRef.current) {
          console.log('SSE: Attempting to reconnect...');
          initializeSSE();
        }
      }, 5000);
    };

    return eventSource;
  };

  // Helper function to build tree structure
  const buildTreeStructure = (allBranches: Branch[], allNodes: Node[]): TreeNode => {
    return {
      id: 'root',
      title: 'Life Tree',
      description: 'Your life as a branching timeline',
      timestamp: new Date().toISOString(),
      type: 'commit' as const,
      parentIds: [],
      children: allBranches.map(branch => ({
        id: branch.branchId,
        title: branch.branchName,
        description: branch.branchSummary,
        timestamp: branch.branchStart,
        type: 'branch' as const,
        branchName: branch.branchName,
        parentIds: branch.parentBranchId ? [branch.parentBranchId] : [],
        children: allNodes
          .filter(node => node.branchId === branch.branchId)
          .map(node => ({
            id: node.uuid,
            title: `Entry ${node.uuid.slice(0, 8)}`,
            description: node.content,
            timestamp: node.timeStamp,
            type: 'commit' as const,
            parentIds: [branch.branchId],
            children: [],
            metadata: {
              status: node.isUpdating ? 'active' : 'completed'
            }
          })),
        metadata: {
          status: branch.branchEnd ? 'completed' : 'active'
        }
      }))
    };
  };

  // Initialize SSE on component mount
  useEffect(() => {
    console.log('SSE: Component mounted - initializing SSE');
    setLoadingNodes(true);
    setLoadingBranches(true);
    const eventSource = initializeSSE();

    return () => {
      console.log('SSE: Component unmounting - closing SSE connection');
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []); // Empty dependency array to run only once

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
    console.log('Starting Vapi call');
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
        // No need to manually refresh since SSE will handle updates
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

      // Send life tree context immediately after starting
      if (tree && stats) {
        const treeContext = {
          tree: tree,
          stats: stats,
          totalNodes: stats.totalNodes,
          totalBranches: stats.totalBranches,
          recentActivity: stats.recentActivity || []
        };

        vapiRef.current.send({
          type: "add-message",
          message: {
            role: "system",
            content: `Here is the current state of the user's life tree: ${JSON.stringify(treeContext, null, 2)}. Use this context to help the user manage their life tree effectively.`,
          },
        });
      }

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

  // Function to refresh all data
  const refreshAllData = async () => {
    // Reconnect SSE to get fresh data
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setLoadingNodes(true);
    setLoadingBranches(true);
    initializeSSE();
    
    // Also refresh recommendations
    await fetchRecommendations();
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to check if a branch is the main branch
  const isMainBranch = (branch: Branch) => {
    return branch.branchId === 'root' && branch.branchName === 'Main';
  };

  // Function to get nodes for a specific branch
  const getNodesForBranch = (branchId: string) => {
    return nodes.filter(node => node.branchId === branchId);
  };

  // New toggleCall function
  const toggleCall = () => {
    if (loading) return;
    if (isCallActive) {
      stopVapiCall();
    } else {
      startVapiCall();
    }
  };

  // New useEffect for spacebar hold
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;

      // Ignore if focused element is an input/textarea/select or contentEditable
      const target = e.target as HTMLElement;
      const tagName = target?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target?.isContentEditable) {
        return;
      }

      e.preventDefault();

      // Start hold animation
      setIsHoldingSpace(true);

      // Ensure no previous timer
      if (spaceHoldTimeout.current) clearTimeout(spaceHoldTimeout.current);

      spaceHoldTimeout.current = setTimeout(() => {
        toggleCall();
        setIsHoldingSpace(false);
        spaceHoldTimeout.current = null;
      }, 500);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;

      // Cancel pending toggle if released early
      if (spaceHoldTimeout.current) {
        clearTimeout(spaceHoldTimeout.current);
        spaceHoldTimeout.current = null;
      }
      setIsHoldingSpace(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isCallActive, loading]);

  // Watch isCallActive and trigger pulse effect
  useEffect(() => {
    if (prevCallActive.current === isCallActive) return;

    if (isCallActive) {
      setPulseType('start');
      // Clear after animation completes (~900ms)
      const timer = setTimeout(() => setPulseType(null), 900);
      return () => clearTimeout(timer);
    } else {
      setPulseType('stop');
      const timer = setTimeout(() => setPulseType(null), 400);
      return () => clearTimeout(timer);
    }
  }, [isCallActive]);

  useEffect(() => {
    prevCallActive.current = isCallActive;
  }, [isCallActive]);

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <Timeline nodes={nodes} branches={branches} loading={loadingNodes || loadingBranches} />
      
      {/* View Mode Toggle */}
      <div className="absolute top-4 left-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'tree' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tree
          </button>
          <button
            onClick={() => setViewMode('nodes')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'nodes' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Nodes
          </button>
          <button
            onClick={() => setViewMode('branches')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'branches' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Branches
          </button>
          <button
            onClick={refreshAllData}
            disabled={loading || loadingNodes || loadingBranches}
            className="px-3 py-1 rounded text-sm font-medium transition-colors bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => {
              const w = window as any;
              if (w.autoFitToData) {
                w.autoFitToData();
              }
            }}
            className="px-3 py-1 rounded text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Auto-Fit
          </button>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/tree/test-update', { method: 'POST' });
                const data = await response.json();
                console.log('Test update response:', data);
              } catch (error) {
                console.error('Test update error:', error);
              }
            }}
            className="px-3 py-1 rounded text-sm font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Test Update
          </button>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/tree/test-subscription');
                const data = await response.json();
                console.log('Subscription test response:', data);
              } catch (error) {
                console.error('Subscription test error:', error);
              }
            }}
            className="px-3 py-1 rounded text-sm font-medium transition-colors bg-yellow-100 text-yellow-700 hover:bg-yellow-200 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Test Sub
          </button>
        </div>
      </div>

      {/* Data Display Panel */}
      <div className="absolute bottom-4 left-4 z-50 max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            {viewMode === 'tree' && 'Tree Overview'}
            {viewMode === 'nodes' && 'All Nodes'}
            {viewMode === 'branches' && 'All Branches'}
          </h3>

          {error && (
            <div className="text-red-600 text-sm mb-3">{error}</div>
          )}

          {viewMode === 'tree' && (
            <div>
              {loading ? (
                <div className="text-gray-500">Loading tree...</div>
              ) : stats ? (
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium">Total Nodes:</span> {stats.totalNodes}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Total Branches:</span> {stats.totalBranches}
                  </div>
                  
                  {/* Main Branch Info */}
                  {branches.length > 0 && (
                    <div className="border-t pt-2">
                      <div className="text-sm font-medium text-gray-800 mb-2">Branches:</div>
                      <div className="space-y-2">
                        {branches.map((branch) => {
                          const isMain = isMainBranch(branch);
                          const nodeCount = getNodesForBranch(branch.branchId).length;
                          
                          return (
                            <div 
                              key={branch.branchId}
                              className={`text-xs p-2 rounded ${
                                isMain 
                                  ? 'bg-purple-100 border border-purple-200' 
                                  : 'bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`font-medium ${isMain ? 'text-purple-800' : 'text-gray-700'}`}>
                                  {branch.branchName}
                                  {isMain && (
                                    <span className="ml-1 text-purple-600">(Main)</span>
                                  )}
                                </span>
                                <span className="text-gray-500">{nodeCount} nodes</span>
                              </div>
                              {branch.branchSummary && (
                                <div className="text-gray-600 mt-1">
                                  {branch.branchSummary}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">No tree data available</div>
              )}
            </div>
          )}

          {viewMode === 'nodes' && (
            <div>
              {loadingNodes ? (
                <div className="text-gray-500">Loading nodes...</div>
              ) : nodes.length > 0 ? (
                <div className="space-y-3">
                  {nodes.map((node) => (
                    <div key={node.uuid} className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 rounded-r">
                      <div className="text-sm font-medium text-gray-800">
                        {node.content.substring(0, 50)}...
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(node.timeStamp)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Branch: {node.branchId.slice(0, 8)}...
                        {node.isUpdating && (
                          <span className="ml-2 text-orange-600">• Updating</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No nodes available</div>
              )}
            </div>
          )}

          {viewMode === 'branches' && (
            <div>
              {loadingBranches ? (
                <div className="text-gray-500">Loading branches...</div>
              ) : branches.length > 0 ? (
                <div className="space-y-3">
                  {branches.map((branch) => {
                    const isMain = isMainBranch(branch);
                    const nodeCount = getNodesForBranch(branch.branchId).length;
                    
                    return (
                      <div 
                        key={branch.branchId} 
                        className={`border-l-4 pl-3 py-2 rounded-r ${
                          isMain 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-green-500 bg-green-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-800">
                            {branch.branchName}
                            {isMain && (
                              <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                                MAIN
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {nodeCount} node{nodeCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {branch.branchSummary}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Started: {formatDate(branch.branchStart)}
                        </div>
                        {branch.branchEnd && (
                          <div className="text-xs text-gray-500">
                            Ended: {formatDate(branch.branchEnd)}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          ID: {branch.branchId === 'root' ? 'root' : branch.branchId.slice(0, 8) + '...'}
                          {branch.parentBranchId && branch.parentBranchId !== '' && (
                            <span className="ml-2">
                              Parent: {branch.parentBranchId === 'root' ? 'root' : branch.parentBranchId.slice(0, 8) + '...'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-500">No branches available</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Voice Call Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={toggleCall}
          disabled={loading}
          className={`relative overflow-visible w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
            isHoldingSpace ? 'duration-500' : 'duration-200'
          } ${
            isCallActive
              ? isHoldingSpace
                ? 'bg-red-700 text-white border-red-500'
                : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white border-red-500'
              : isHoldingSpace
                ? 'bg-white bg-opacity-60 text-black border-white'
                : 'bg-transparent hover:bg-white hover:bg-opacity-20 disabled:opacity-50 text-white hover:text-black border-white'
          }`}
        >
          {/* Pulsating overlay */}
          {pulseType && (
            <span
              className={`absolute inset-0 rounded-full pointer-events-none z-0 ${
                pulseType === 'start'
                  ? 'bg-white/40 animate-[ping_0.9s_linear]'
                  : 'bg-red-500/50 animate-[ping_0.4s_linear]'
              }`}
            />
          )}
          {/* Icon container with higher z-index */}
          <span className="relative z-10 flex items-center">
            {isCallActive ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
