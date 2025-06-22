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

  // Add function to fetch nodes separately
  const fetchNodes = async () => {
    setLoadingNodes(true);
    setError(null);
    try {
      const response = await fetch('/api/tree?action=nodes');
      console.log('Nodes response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Nodes data:', data);
      
      if (data.success) {
        setNodes(data.nodes);
      } else {
        setError(data.error || 'Failed to fetch nodes');
      }
    } catch (err) {
      console.error('Error fetching nodes:', err);
      setError(`Failed to fetch nodes: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingNodes(false);
    }
  };

  // Add function to fetch branches separately
  const fetchBranches = async () => {
    setLoadingBranches(true);
    setError(null);
    try {
      const response = await fetch('/api/tree?action=branches');
      console.log('Branches response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Branches data:', data);
      
      if (data.success) {
        setBranches(data.branches);
      } else {
        setError(data.error || 'Failed to fetch branches');
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError(`Failed to fetch branches: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingBranches(false);
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
        fetchTree(); // Refresh tree data after call ends
        fetchNodes(); // Refresh nodes data after call ends
        fetchBranches(); // Refresh branches data after call ends
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

  useEffect(() => {
    refreshAllData();
  }, []);

  // Function to refresh all data
  const refreshAllData = async () => {
    await Promise.all([
      fetchTree(),
      fetchNodes(),
      fetchBranches()
    ]);
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
          onClick={isCallActive ? stopVapiCall : startVapiCall}
          disabled={loading}
          className={`font-semibold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg border ${
            isCallActive 
              ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white border-red-500' 
              : 'bg-white hover:bg-gray-100 disabled:bg-gray-300 text-black border-gray-200'
          }`}
        >
          {isCallActive ? '🛑 Stop Call' : '🎤 Start Voice Call'}
        </button>
      </div>
    </div>
  );
}
